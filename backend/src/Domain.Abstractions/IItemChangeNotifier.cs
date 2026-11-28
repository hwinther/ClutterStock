namespace ClutterStock.Domain.Abstractions;

/// <summary>
///     Publishes item-change notifications so other processes (notably the SSR
///     frontend) can push live updates to connected clients via SSE.
///     Implementations MUST be best-effort: a publish failure must never fail the
///     originating command — an item edit should still succeed if the message bus
///     is unavailable.
/// </summary>
public interface IItemChangeNotifier
{
    Task PublishAsync(ItemChange change, CancellationToken cancellationToken = default);
}

/// <summary>
///     A change to an item, broadcast to subscribers. <c>closed</c>: only this assembly can derive
///     from it, so a switch over the three cases below is exhaustive without a default arm, and a
///     new kind of change fails the build until every switch (e.g. the wire name in the Redis
///     notifier) handles it.
/// </summary>
/// <param name="Id">The affected item id.</param>
/// <param name="RoomId">The room the item belongs to (allows clients to scope refreshes).</param>
public closed record ItemChange(int Id, int RoomId);

/// <summary>An item was created.</summary>
public sealed record ItemCreated(int Id, int RoomId) : ItemChange(Id, RoomId);

/// <summary>An item was updated.</summary>
public sealed record ItemUpdated(int Id, int RoomId) : ItemChange(Id, RoomId);

/// <summary>An item was deleted.</summary>
public sealed record ItemDeleted(int Id, int RoomId) : ItemChange(Id, RoomId);
