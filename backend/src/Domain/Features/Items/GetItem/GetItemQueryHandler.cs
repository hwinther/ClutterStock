using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Items.GetItem;

public interface IGetItemQueryHandler : IQueryHandler
{
    record Query(int Id);

    Task<Item?> HandleAsync(Query query, CancellationToken cancellationToken = default);
}

public class GetItemQueryHandler(IAppDbContext context) : IGetItemQueryHandler
{
    public async Task<Item?> HandleAsync(IGetItemQueryHandler.Query query, CancellationToken cancellationToken = default)
    {
        return await context.Items
            .FirstOrDefaultAsync(i => i.Id == query.Id, cancellationToken);
    }
}
