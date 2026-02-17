using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Infrastructure.Persistence;

public class ItemRepository(AppDbContext context) : IItemRepository
{
    public async Task<Item> AddAsync(Item item, CancellationToken cancellationToken = default)
    {
        context.Items.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return item;
    }
}
