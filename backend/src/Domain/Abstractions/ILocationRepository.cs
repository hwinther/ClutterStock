using ClutterStock.Entities;

namespace ClutterStock.Domain.Abstractions;

public interface ILocationRepository
{
    Task<Location> AddAsync(Location location, CancellationToken cancellationToken = default);
}
