using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Locations.GetLocation;

public interface IGetLocationQueryHandler : IQueryHandler
{
    Task<Found<Location>> HandleAsync(Query query, CancellationToken cancellationToken = default);

    record Query(int Id);
}

public class GetLocationQueryHandler(IAppDbContext context) : IGetLocationQueryHandler
{
    public async Task<Found<Location>> HandleAsync(IGetLocationQueryHandler.Query query, CancellationToken cancellationToken = default)
    {
        var location = await context.Locations
                            .FirstOrDefaultAsync(l => l.Id == query.Id, cancellationToken);
        if (location is null)
            return new EntityNotFound(query.Id);

        return location;
    }
}
