using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Items.GetItem;

public interface IGetItemQueryHandler : IQueryHandler
{
    Task<Found<Item>> HandleAsync(Query query, CancellationToken cancellationToken = default);

    record Query(int Id);
}

public class GetItemQueryHandler(IAppDbContext context) : IGetItemQueryHandler
{
    public async Task<Found<Item>> HandleAsync(IGetItemQueryHandler.Query query, CancellationToken cancellationToken = default)
    {
        var item = await context.Items
                            .FirstOrDefaultAsync(i => i.Id == query.Id, cancellationToken);
        if (item is null)
            return new EntityNotFound(query.Id);

        return item;
    }
}
