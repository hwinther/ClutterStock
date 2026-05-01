using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ClutterStock.Api.Tests.Infrastructure;
using ClutterStock.Contracts.Items;
using ClutterStock.Entities;
using ClutterStock.Infrastructure.Database;
using Microsoft.Extensions.DependencyInjection;

namespace ClutterStock.Api.Tests.Items;

public sealed class ItemsApiTests : IClassFixture<ClutterStockApiFactory>, IAsyncLifetime
{
    private const string ItemsRoute = "/api/v1/items";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ClutterStockApiFactory _factory;

    public ItemsApiTests(ClutterStockApiFactory factory) => _factory = factory;

    public async ValueTask InitializeAsync() => await _factory.ResetDatabaseAsync();

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private HttpClient CreateAuthenticatedClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName);
        return client;
    }

    private async Task<int> SeedRoomAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();

        var location = new Location
        {
            Name = "Home",
            CreatedAtUtc = DateTimeOffset.UtcNow
        };
        db.Locations.Add(location);
        await db.SaveChangesAsync(Ct);

        var room = new Room
        {
            LocationId = location.Id,
            Name = "Garage",
            CreatedAtUtc = DateTimeOffset.UtcNow
        };
        db.Rooms.Add(room);
        await db.SaveChangesAsync(Ct);

        return room.Id;
    }

    [Fact]
    public async Task Post_WithoutAuth_Returns401()
    {
        var anonymous = _factory.CreateClient();

        var response = await anonymous.PostAsJsonAsync(ItemsRoute,
                                                       new AddItemRequest(1, "Screwdriver", null, null, null),
                                                       Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Post_RoomIdZero_Returns400WithValidationError()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(ItemsRoute,
                                                    new AddItemRequest(0, "Screwdriver", null, null, null),
                                                    Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadValidationProblemAsync(response);
        Assert.True(problem.Errors.ContainsKey("RoomId"),
                    $"expected RoomId error, got: [{string.Join(",", problem.Errors.Keys)}]");
    }

    [Fact]
    public async Task Post_EmptyName_Returns400WithValidationError()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(ItemsRoute,
                                                    new AddItemRequest(1, "", null, null, null),
                                                    Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadValidationProblemAsync(response);
        Assert.True(problem.Errors.ContainsKey("Name"));
    }

    [Fact]
    public async Task Post_NameTooLong_Returns400WithValidationError()
    {
        var client = CreateAuthenticatedClient();
        var oversized = new string('x', 201);

        var response = await client.PostAsJsonAsync(ItemsRoute,
                                                    new AddItemRequest(1, oversized, null, null, null),
                                                    Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadValidationProblemAsync(response);
        Assert.True(problem.Errors.ContainsKey("Name"));
    }

    [Fact]
    public async Task Post_HappyPath_Returns201WithLocationHeader()
    {
        var roomId = await SeedRoomAsync();
        var client = CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(ItemsRoute,
                                                    new AddItemRequest(roomId, "Drill", "Cordless", "Tools", null),
                                                    Ct);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var created = await response.Content.ReadFromJsonAsync<ItemResponse>(Ct);
        Assert.NotNull(created);
        Assert.Equal(roomId, created!.RoomId);
        Assert.Equal("Drill", created.Name);
        Assert.True(created.Id > 0);
    }

    [Fact]
    public async Task Get_IdZero_Returns400()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.GetAsync($"{ItemsRoute}/0", Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadValidationProblemAsync(response);
        Assert.True(problem.Errors.ContainsKey("id"),
                    $"expected id error, got: [{string.Join(",", problem.Errors.Keys)}]");
    }

    [Fact]
    public async Task Get_Unknown_Returns404()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.GetAsync($"{ItemsRoute}/9999", Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_List_ReturnsCreatedItem()
    {
        var roomId = await SeedRoomAsync();
        var client = CreateAuthenticatedClient();
        await client.PostAsJsonAsync(ItemsRoute, new AddItemRequest(roomId, "Hammer", null, null, null), Ct);

        var response = await client.GetAsync(ItemsRoute, Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<IReadOnlyList<ItemResponse>>(Ct);
        Assert.NotNull(items);
        Assert.Single(items!);
        Assert.Equal("Hammer", items![0].Name);
    }

    [Fact]
    public async Task Put_Unknown_Returns404()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.PutAsJsonAsync($"{ItemsRoute}/9999",
                                                   new UpdateItemRequest(1, "Anything", null, null, null),
                                                   Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_HappyPath_UpdatesItem()
    {
        var roomId = await SeedRoomAsync();
        var client = CreateAuthenticatedClient();
        var created = await CreateItemAsync(client, roomId, "Original");

        var response = await client.PutAsJsonAsync($"{ItemsRoute}/{created.Id}",
                                                   new UpdateItemRequest(roomId, "Renamed", "newdesc", null, null),
                                                   Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<ItemResponse>(Ct);
        Assert.NotNull(updated);
        Assert.Equal("Renamed", updated!.Name);
        Assert.Equal("newdesc", updated.Description);
        Assert.NotNull(updated.UpdatedAtUtc);
    }

    [Fact]
    public async Task Delete_HappyPath_Returns204ThenGetReturns404()
    {
        var roomId = await SeedRoomAsync();
        var client = CreateAuthenticatedClient();
        var created = await CreateItemAsync(client, roomId, "Throwaway");

        var deleteResponse = await client.DeleteAsync($"{ItemsRoute}/{created.Id}", Ct);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await client.GetAsync($"{ItemsRoute}/{created.Id}", Ct);
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_Unknown_Returns404()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.DeleteAsync($"{ItemsRoute}/9999", Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ValidationProblem_IncludesRequestIdAndTraceIdExtensions()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(ItemsRoute,
                                                    new AddItemRequest(0, "", null, null, null),
                                                    Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync(Ct);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        Assert.True(root.TryGetProperty("requestId", out var requestId)
                    && requestId.ValueKind == JsonValueKind.String
                    && requestId.GetString()!.Length > 0,
                    "expected non-empty requestId extension on ProblemDetails");
        Assert.True(root.TryGetProperty("traceId", out var traceId)
                    && traceId.ValueKind == JsonValueKind.String
                    && traceId.GetString()!.Length > 0,
                    "expected non-empty traceId extension on ProblemDetails");
    }

    private static async Task<ItemResponse> CreateItemAsync(HttpClient client, int roomId, string name)
    {
        var response = await client.PostAsJsonAsync(ItemsRoute,
                                                    new AddItemRequest(roomId, name, null, null, null),
                                                    Ct);
        response.EnsureSuccessStatusCode();
        var item = await response.Content.ReadFromJsonAsync<ItemResponse>(Ct);
        return item ?? throw new InvalidOperationException("ItemResponse was null");
    }

    private static async Task<ValidationProblemBody> ReadValidationProblemAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync(Ct);
        var problem = JsonSerializer.Deserialize<ValidationProblemBody>(body, JsonOptions);
        return problem ?? throw new InvalidOperationException($"Could not parse ValidationProblemDetails: {body}");
    }

    private sealed record ValidationProblemBody(
        string? Type,
        string? Title,
        int? Status,
        Dictionary<string, string[]> Errors);
}
