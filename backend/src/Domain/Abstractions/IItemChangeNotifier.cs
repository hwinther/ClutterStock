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

/// <summary>A change to an item, broadcast to subscribers.</summary>
/// <param name="Type">Change kind, e.g. <c>item.created</c>, <c>item.updated</c>, <c>item.deleted</c>.</param>
/// <param name="Id">The affected item id.</param>
/// <param name="RoomId">The room the item belongs to (allows clients to scope refreshes).</param>
public readonly record struct ItemChange(string Type, int Id, int RoomId);
