using System.Text.Json;
using ClutterStock.Domain.Abstractions;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace ClutterStock.Infrastructure.Messaging;

/// <summary>
///     Publishes item changes to a Redis pub/sub channel that the SSR frontend
///     subscribes to. Best-effort: any failure is logged and swallowed so an item
///     mutation never fails because Redis is unavailable.
/// </summary>
public sealed class RedisItemChangeNotifier(IConnectionMultiplexer redis, ILogger<RedisItemChangeNotifier> logger)
    : IItemChangeNotifier
{
    /// <summary>Channel name shared with the frontend SSE subscriber.</summary>
    public const string Channel = "clutterstock:item-changes";

    public async Task PublishAsync(ItemChange change, CancellationToken cancellationToken = default)
    {
        try
        {
            var payload = JsonSerializer.Serialize(new
            {
                type = change.Type,
                id = change.Id,
                roomId = change.RoomId,
                ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            });

            await redis.GetSubscriber().PublishAsync(RedisChannel.Literal(Channel), payload);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to publish {ChangeType} for item {ItemId}", change.Type, change.Id);
        }
    }
}
