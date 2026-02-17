using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Infrastructure.Persistence;

public class LocationRepository(AppDbContext context) : ILocationRepository
{
    public async Task<Location> AddAsync(Location location, CancellationToken cancellationToken = default)
    {
        context.Locations.Add(location);
        await context.SaveChangesAsync(cancellationToken);
        return location;
    }
}
