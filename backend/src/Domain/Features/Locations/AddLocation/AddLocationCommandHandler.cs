using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Features.Locations.AddLocation;

public interface IAddLocationCommandHandler : ICommandHandler
{
    record Command(string Name, string? Description);

    Task<Location> HandleAsync(Command command, CancellationToken cancellationToken = default);
}

public class AddLocationCommandHandler(IAppDbContext context) : IAddLocationCommandHandler
{
    public async Task<Location> HandleAsync(IAddLocationCommandHandler.Command command, CancellationToken cancellationToken = default)
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
