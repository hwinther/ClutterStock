using System.Data.Common;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using ClutterStock.Api.Tests.Infrastructure;
using ClutterStock.Contracts.Rooms;
using ClutterStock.Entities;
using ClutterStock.Infrastructure.Database;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;

namespace ClutterStock.Api.Tests.Rooms;

/// <summary>
///     A PUT whose row another request deletes between the load and the save (the race the ZAP API
///     scan hit): the save affects 0 rows, and the API answers 404 instead of 500.
/// </summary>
public sealed class ConcurrentDeleteTests : IClassFixture<ClutterStockApiFactory>, IAsyncLifetime
{
    private readonly ClutterStockApiFactory _factory;

    public ConcurrentDeleteTests(ClutterStockApiFactory factory) => _factory = factory;

    public async ValueTask InitializeAsync() => await _factory.ResetDatabaseAsync();

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Put_RoomDeletedBeforeTheSave_Returns404()
    {
        int roomId;
        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();
            var location = new Location { Name = "Home", CreatedAtUtc = DateTimeOffset.UtcNow };
            db.Locations.Add(location);
            await db.SaveChangesAsync(Ct);
            var room = new Room { LocationId = location.Id, Name = "Garage", CreatedAtUtc = DateTimeOffset.UtcNow };
            db.Rooms.Add(room);
            await db.SaveChangesAsync(Ct);
            roomId = room.Id;
        }

        using var racing = _factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            services.ConfigureDbContext<ApplicationContext>(options =>
                options.AddInterceptors(new DeleteRoomBeforeSaveInterceptor()))));
        var client = racing.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthHandler.SchemeName);

        var response = await client.PutAsJsonAsync($"/api/v1/rooms/{roomId}",
                                                   new UpdateRoomRequest(1, "Renamed", null),
                                                   Ct);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>Deletes every modified room from the database just before EF Core saves it.</summary>
    private sealed class DeleteRoomBeforeSaveInterceptor : SaveChangesInterceptor
    {
        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData,
                                                                                    InterceptionResult<int> result,
                                                                                    CancellationToken cancellationToken = default)
        {
            var context = eventData.Context!;
            foreach (var entry in context.ChangeTracker.Entries<Room>().Where(static e => e.State == EntityState.Modified))
            {
                await context.Database.ExecuteSqlAsync($"""DELETE FROM "Room" WHERE "Id" = {entry.Entity.Id}""",
                                                       cancellationToken);
            }

            return result;
        }
    }
}
