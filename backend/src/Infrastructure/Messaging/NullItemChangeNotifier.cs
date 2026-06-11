using ClutterStock.Domain.Abstractions;

namespace ClutterStock.Infrastructure.Messaging;

/// <summary>
///     No-op notifier used when Redis is not configured — integration tests
///     (Testcontainer Postgres, no Redis), the Migrator, and local runs without a
///     message bus. Keeps item mutations working without live updates.
/// </summary>
public sealed class NullItemChangeNotifier : IItemChangeNotifier
{
    public Task PublishAsync(ItemChange change, CancellationToken cancellationToken = default) => Task.CompletedTask;
}
