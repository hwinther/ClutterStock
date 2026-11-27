using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Locations.UpdateLocation;

public interface IUpdateLocationCommandHandler : ICommandHandler
{
    Task<Found<Location>> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id, string Name, string? Description);
}

public class UpdateLocationCommandHandler(IAppDbContext context) : IUpdateLocationCommandHandler
{
    public async Task<Found<Location>> HandleAsync(IUpdateLocationCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var location = await context.Locations.FirstOrDefaultAsync(l => l.Id == command.Id, cancellationToken);
        if (location is null)
            return new EntityNotFound(command.Id);

        location.Name = command.Name;
        location.Description = command.Description;
        location.UpdatedAtUtc = DateTimeOffset.UtcNow;

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new EntityNotFound(command.Id);
        }

        return location;
    }
}
