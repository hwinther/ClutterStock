using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ClutterStock.Api.Tests.Infrastructure;
using ClutterStock.Contracts.Locations;

namespace ClutterStock.Api.Tests.Locations;

public sealed class LocationsApiTests : IClassFixture<ClutterStockApiFactory>, IAsyncLifetime
{
    private const string LocationsRoute = "/api/v1/locations";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ClutterStockApiFactory _factory;

    public LocationsApiTests(ClutterStockApiFactory factory) => _factory = factory;

    public async ValueTask InitializeAsync() => await _factory.ResetDatabaseAsync();

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    private HttpClient CreateAuthenticatedClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName);
        return client;
    }

    [Fact]
    public async Task Post_WithoutAuth_Returns401()
    {
        var anonymous = _factory.CreateClient();

        var response = await anonymous.PostAsJsonAsync(LocationsRoute,
                                                       new AddLocationRequest("Home", null),
                                                       Ct);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Post_EmptyName_Returns400WithValidationError()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(LocationsRoute,
                                                    new AddLocationRequest("", null),
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

        var response = await client.PostAsJsonAsync(LocationsRoute,
                                                    new AddLocationRequest(oversized, null),
                                                    Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadValidationProblemAsync(response);
        Assert.True(problem.Errors.ContainsKey("Name"));
    }

    [Fact]
    public async Task Post_HappyPath_Returns201WithLocationHeader()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.PostAsJsonAsync(LocationsRoute,
                                                    new AddLocationRequest("Home", "Main residence"),
                                                    Ct);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);

        var created = await response.Content.ReadFromJsonAsync<LocationResponse>(Ct);
        Assert.NotNull(created);
        Assert.Equal("Home", created!.Name);
        Assert.Equal("Main residence", created.Description);
        Assert.True(created.Id > 0);
    }

    [Fact]
    public async Task Get_IdZero_Returns400()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.GetAsync($"{LocationsRoute}/0", Ct);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var problem = await ReadValidationProblemAsync(response);
        Assert.True(problem.Errors.ContainsKey("id"),
                    $"expected id error, got: [{string.Join(",", problem.Errors.Keys)}]");
    }

    [Fact]
    public async Task Get_Unknown_Returns404()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.GetAsync($"{LocationsRoute}/9999", Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_List_ReturnsCreatedLocation()
    {
        var client = CreateAuthenticatedClient();
        await client.PostAsJsonAsync(LocationsRoute, new AddLocationRequest("Office", null), Ct);

        var response = await client.GetAsync(LocationsRoute, Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var locations = await response.Content.ReadFromJsonAsync<IReadOnlyList<LocationResponse>>(Ct);
        Assert.NotNull(locations);
        Assert.Single(locations!);
        Assert.Equal("Office", locations![0].Name);
    }

    [Fact]
    public async Task Put_Unknown_Returns404()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.PutAsJsonAsync($"{LocationsRoute}/9999",
                                                   new UpdateLocationRequest("Anything", null),
                                                   Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Put_HappyPath_UpdatesLocation()
    {
        var client = CreateAuthenticatedClient();
        var created = await CreateLocationAsync(client, "Original");

        var response = await client.PutAsJsonAsync($"{LocationsRoute}/{created.Id}",
                                                   new UpdateLocationRequest("Renamed", "newdesc"),
                                                   Ct);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<LocationResponse>(Ct);
        Assert.NotNull(updated);
        Assert.Equal("Renamed", updated!.Name);
        Assert.Equal("newdesc", updated.Description);
        Assert.NotNull(updated.UpdatedAtUtc);
    }

    [Fact]
    public async Task Delete_HappyPath_Returns204ThenGetReturns404()
    {
        var client = CreateAuthenticatedClient();
        var created = await CreateLocationAsync(client, "Throwaway");

        var deleteResponse = await client.DeleteAsync($"{LocationsRoute}/{created.Id}", Ct);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await client.GetAsync($"{LocationsRoute}/{created.Id}", Ct);
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_Unknown_Returns404()
    {
        var client = CreateAuthenticatedClient();

        var response = await client.DeleteAsync($"{LocationsRoute}/9999", Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private static async Task<LocationResponse> CreateLocationAsync(HttpClient client, string name)
    {
        var response = await client.PostAsJsonAsync(LocationsRoute,
                                                    new AddLocationRequest(name, null),
                                                    Ct);
        response.EnsureSuccessStatusCode();
        var location = await response.Content.ReadFromJsonAsync<LocationResponse>(Ct);
        return location ?? throw new InvalidOperationException("LocationResponse was null");
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
