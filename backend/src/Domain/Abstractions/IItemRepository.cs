using ClutterStock.Entities;

namespace ClutterStock.Domain.Abstractions;

public interface IItemRepository
{
    Task<Item> AddAsync(Item item, CancellationToken cancellationToken = default);
}
