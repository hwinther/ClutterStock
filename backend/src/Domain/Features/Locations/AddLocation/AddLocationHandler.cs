using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Features.Locations.AddLocation;

public class AddLocationHandler(IAppDbContext context)
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

        context.Locations.Add(location);
        await context.SaveChangesAsync(cancellationToken);
        return location;
    }
}
