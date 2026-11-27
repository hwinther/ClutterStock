using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Features.Rooms.AddRoom;

public interface IAddRoomCommandHandler : ICommandHandler
{
    Task<AddOutcome<Room>> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int LocationId, string Name, string? Description);
}

public class AddRoomCommandHandler(IAppDbContext context) : IAddRoomCommandHandler
{
    public async Task<AddOutcome<Room>> HandleAsync(IAddRoomCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var room = new Room
        {
            LocationId = command.LocationId,
            Name = command.Name,
            Description = command.Description,
            CreatedAtUtc = now
        };

        context.Rooms.Add(room);
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (MissingReferenceException missing)
        {
            return new MissingReference(missing.Property, missing.Principal);
        }

        return room;
    }
}