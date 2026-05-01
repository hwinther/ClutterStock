using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ClutterStock.Api.Tests.Infrastructure;
using ClutterStock.Contracts.Rooms;
using ClutterStock.Entities;
using ClutterStock.Infrastructure.Database;
using Microsoft.Extensions.DependencyInjection;

namespace ClutterStock.Api.Tests.Rooms;

public sealed class RoomsApiTests : IClassFixture<ClutterStockApiFactory>, IAsyncLifetime
{
    private const string RoomsRoute = "/api/v1/rooms";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ClutterStockApiFactory _factory;

    public RoomsApiTests(ClutterStockApiFactory factory) => _factory = factory;

    public async ValueTask InitializeAsync() => await _factory.ResetDatabaseAsync();

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private HttpClient CreateAuthenticatedClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName);
        return client;
    }

    private async Task<int> SeedLocationAsync()
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

        return location.Id;
    }

    [Fact]
    public async Task Post_WithoutAuth_Returns401()
    {
        var anonymous = _factory.CreateClient();

        var response = await anonymous.PostAsJsonAsync(RoomsRoute,
                                                       new AddRoomRequest(1, "Garage", null),
                                                       Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Post_LocationIdZero_Returns400WithValidationError()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(RoomsRoute,
                                                    new AddRoomRequest(0, "Garage", null),
                                                    Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadValidationProblemAsync(response);
        Assert.True(problem.Errors.ContainsKey("LocationId"),
                    $"expected LocationId error, got: [{string.Join(",", problem.Errors.Keys)}]");
    }

    [Fact]
    public async Task Post_EmptyName_Returns400WithValidationError()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(RoomsRoute,
                                                    new AddRoomRequest(1, "", null),
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

        var response = await client.PostAsJsonAsync(RoomsRoute,
                                                    new AddRoomRequest(1, oversized, null),
                                                    Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadValidationProblemAsync(response);
        Assert.True(problem.Errors.ContainsKey("Name"));
    }

    [Fact]
    public async Task Post_HappyPath_Returns201WithLocationHeader()
    {
        var locationId = await SeedLocationAsync();
        var client = CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(RoomsRoute,
                                                    new AddRoomRequest(locationId, "Living Room", "Main gathering space"),
                                                    Ct);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var created = await response.Content.ReadFromJsonAsync<RoomResponse>(Ct);
        Assert.NotNull(created);
        Assert.Equal(locationId, created!.LocationId);
        Assert.Equal("Living Room", created.Name);
        Assert.True(created.Id > 0);
    }

    [Fact]
    public async Task Get_IdZero_Returns400()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.GetAsync($"{RoomsRoute}/0", Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadValidationProblemAsync(response);
        Assert.True(problem.Errors.ContainsKey("id"),
                    $"expected id error, got: [{string.Join(",", problem.Errors.Keys)}]");
    }

    [Fact]
    public async Task Get_Unknown_Returns404()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.GetAsync($"{RoomsRoute}/9999", Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_List_ReturnsCreatedRoom()
    {
        var locationId = await SeedLocationAsync();
        var client = CreateAuthenticatedClient();
        await client.PostAsJsonAsync(RoomsRoute, new AddRoomRequest(locationId, "Garage", null), Ct);

        var response = await client.GetAsync(RoomsRoute, Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var rooms = await response.Content.ReadFromJsonAsync<IReadOnlyList<RoomResponse>>(Ct);
        Assert.NotNull(rooms);
        Assert.Single(rooms!);
        Assert.Equal("Garage", rooms![0].Name);
    }

    [Fact]
    public async Task Put_Unknown_Returns404()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.PutAsJsonAsync($"{RoomsRoute}/9999",
                                                   new UpdateRoomRequest(1, "Anything", null),
                                                   Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_HappyPath_UpdatesRoom()
    {
        var locationId = await SeedLocationAsync();
        var client = CreateAuthenticatedClient();
        var created = await CreateRoomAsync(client, locationId, "Original");

        var response = await client.PutAsJsonAsync($"{RoomsRoute}/{created.Id}",
                                                   new UpdateRoomRequest(locationId, "Renamed", "newdesc"),
                                                   Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<RoomResponse>(Ct);
        Assert.NotNull(updated);
        Assert.Equal("Renamed", updated!.Name);
        Assert.Equal("newdesc", updated.Description);
        Assert.NotNull(updated.UpdatedAtUtc);
    }

    [Fact]
    public async Task Delete_HappyPath_Returns204ThenGetReturns404()
    {
        var locationId = await SeedLocationAsync();
        var client = CreateAuthenticatedClient();
        var created = await CreateRoomAsync(client, locationId, "Throwaway");

        var deleteResponse = await client.DeleteAsync($"{RoomsRoute}/{created.Id}", Ct);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await client.GetAsync($"{RoomsRoute}/{created.Id}", Ct);
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_Unknown_Returns404()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.DeleteAsync($"{RoomsRoute}/9999", Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static async Task<RoomResponse> CreateRoomAsync(HttpClient client, int locationId, string name)
    {
        var response = await client.PostAsJsonAsync(RoomsRoute,
                                                    new AddRoomRequest(locationId, name, null),
                                                    Ct);
        response.EnsureSuccessStatusCode();
        var room = await response.Content.ReadFromJsonAsync<RoomResponse>(Ct);
        return room ?? throw new InvalidOperationException("RoomResponse was null");
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
