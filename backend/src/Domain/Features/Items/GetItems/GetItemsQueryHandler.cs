using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Items.GetItems;

public interface IGetItemsQueryHandler : IQueryHandler
{
    Task<IReadOnlyList<Item>> HandleAsync(CancellationToken cancellationToken = default);
}

public class GetItemsQueryHandler(IAppDbContext context) : IGetItemsQueryHandler
{
    public async Task<IReadOnlyList<Item>> HandleAsync(CancellationToken cancellationToken = default)
    {
        return await context.Items
            .OrderBy(i => i.Id)
            .ToListAsync(cancellationToken);
    }
}
