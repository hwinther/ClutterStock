using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Locations.AddLocation;

public class AddLocationHandler(ILocationRepository repository)
{
    public async Task<Location> HandleAsync(AddLocationCommand command, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var location = new Location
        {
            Name = command.Name,
            Description = command.Description,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        return await repository.AddAsync(location, cancellationToken);
    }
}
