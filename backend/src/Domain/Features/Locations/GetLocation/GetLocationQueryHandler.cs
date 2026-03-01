using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Locations.GetLocation;

public interface IGetLocationQueryHandler : IQueryHandler
{
    record Query(int Id);

    Task<Location?> HandleAsync(Query query, CancellationToken cancellationToken = default);
}

public class GetLocationQueryHandler(IAppDbContext context) : IGetLocationQueryHandler
{
    public async Task<Location?> HandleAsync(IGetLocationQueryHandler.Query query, CancellationToken cancellationToken = default)
    {
        return await context.Locations
            .FirstOrDefaultAsync(l => l.Id == query.Id, cancellationToken);
    }
}
