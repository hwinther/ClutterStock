using System.Collections.Concurrent;
using ClutterStock.Api.Tests.Database;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Features.Items.AddItem;
using ClutterStock.Domain.Features.Items.DeleteItem;
using ClutterStock.Domain.Features.Items.UpdateItem;
using ClutterStock.Entities;
using ClutterStock.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Api.Tests.Items;

/// <summary>
///     Verifies the item command handlers publish an <see cref="ItemChange" />
///     after a successful mutation (and not on a no-op). Drives the real handlers
///     against a Postgres Testcontainer with a recording notifier in place of
///     Redis — the SSE relay itself is exercised end-to-end by the Playwright
///     suite.
/// </summary>
[Collection("ApplicationContext")]
public sealed class ItemChangeNotifierTests : IAsyncLifetime, IAsyncDisposable
{
    private readonly RecordingNotifier _notifier = new();
    private ApplicationContext _context = null!;
    private PostgreSqlDefaultConfiguration _postgres = null!;

    public async ValueTask InitializeAsync()
    {
        _postgres = new PostgreSqlDefaultConfiguration();
        await _postgres.InitializeAsync();

        var options = new DbContextOptionsBuilder<ApplicationContext>()
                      .UseNpgsql(_postgres.PostgreSqlContainer.GetConnectionString())
                      .Options;
        _context = new ApplicationContext(options);
        await _context.Database.MigrateAsync(CancellationToken.None);
    }

    public async ValueTask DisposeAsync()
    {
        await _context.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task AddItem_PublishesItemCreated()
    {
        var roomId = await SeedRoomAsync();
        var handler = new AddItemCommandHandler(_context, _notifier);

        var item = await handler.HandleAsync(new IAddItemCommandHandler.Command(roomId, "Drill", null, null, null), Ct);

        var change = Assert.Single(_notifier.Published);
        Assert.Equal("item.created", change.Type);
        Assert.Equal(item.Id, change.Id);
        Assert.Equal(roomId, change.RoomId);
    }

    [Fact]
    public async Task UpdateItem_PublishesItemUpdated()
    {
        var roomId = await SeedRoomAsync();
        var item = await new AddItemCommandHandler(_context, _notifier)
            .HandleAsync(new IAddItemCommandHandler.Command(roomId, "Original", null, null, null), Ct);
        _notifier.Published.Clear();

        await new UpdateItemCommandHandler(_context, _notifier)
            .HandleAsync(new IUpdateItemCommandHandler.Command(item.Id, roomId, "Renamed", null, null, null), Ct);

        var change = Assert.Single(_notifier.Published);
        Assert.Equal("item.updated", change.Type);
        Assert.Equal(item.Id, change.Id);
        Assert.Equal(roomId, change.RoomId);
    }

    [Fact]
    public async Task DeleteItem_PublishesItemDeleted()
    {
        var roomId = await SeedRoomAsync();
        var item = await new AddItemCommandHandler(_context, _notifier)
            .HandleAsync(new IAddItemCommandHandler.Command(roomId, "Throwaway", null, null, null), Ct);
        _notifier.Published.Clear();

        var deleted = await new DeleteItemCommandHandler(_context, _notifier)
            .HandleAsync(new IDeleteItemCommandHandler.Command(item.Id), Ct);

        Assert.True(deleted);
        var change = Assert.Single(_notifier.Published);
        Assert.Equal("item.deleted", change.Type);
        Assert.Equal(item.Id, change.Id);
        Assert.Equal(roomId, change.RoomId);
    }

    [Fact]
    public async Task DeleteItem_Unknown_DoesNotPublish()
    {
        var deleted = await new DeleteItemCommandHandler(_context, _notifier)
            .HandleAsync(new IDeleteItemCommandHandler.Command(9999), Ct);

        Assert.False(deleted);
        Assert.Empty(_notifier.Published);
    }

    private async Task<int> SeedRoomAsync()
    {
        var location = new Location { Name = "Home", CreatedAtUtc = DateTimeOffset.UtcNow };
        _context.Locations.Add(location);
        await _context.SaveChangesAsync(Ct);

        var room = new Room { LocationId = location.Id, Name = "Garage", CreatedAtUtc = DateTimeOffset.UtcNow };
        _context.Rooms.Add(room);
        await _context.SaveChangesAsync(Ct);

        return room.Id;
    }

    private sealed class RecordingNotifier : IItemChangeNotifier
    {
        public ConcurrentQueue<ItemChange> Published { get; } = new();

        public Task PublishAsync(ItemChange change, CancellationToken cancellationToken = default)
        {
            Published.Enqueue(change);
            return Task.CompletedTask;
        }
    }
}
