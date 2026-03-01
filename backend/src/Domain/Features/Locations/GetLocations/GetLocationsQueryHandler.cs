using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Locations.GetLocations;

public interface IGetLocationsQueryHandler : IQueryHandler
{
    Task<IReadOnlyList<Location>> HandleAsync(CancellationToken cancellationToken = default);
}

public class GetLocationsQueryHandler(IAppDbContext context) : IGetLocationsQueryHandler
{
    public async Task<IReadOnlyList<Location>> HandleAsync(CancellationToken cancellationToken = default)
    {
        return await context.Locations
                            .OrderBy(l => l.Id)
                            .ToListAsync(cancellationToken);
    }
}