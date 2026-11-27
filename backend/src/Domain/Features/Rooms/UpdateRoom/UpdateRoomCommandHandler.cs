using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Rooms.UpdateRoom;

public interface IUpdateRoomCommandHandler : ICommandHandler
{
    Task<UpdateOutcome<Room>> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id, int LocationId, string Name, string? Description);
}

public class UpdateRoomCommandHandler(IAppDbContext context) : IUpdateRoomCommandHandler
{
    public async Task<UpdateOutcome<Room>> HandleAsync(IUpdateRoomCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var room = await context.Rooms.FirstOrDefaultAsync(r => r.Id == command.Id, cancellationToken);
        if (room is null)
            return new EntityNotFound(command.Id);

        room.LocationId = command.LocationId;
        room.Name = command.Name;
        room.Description = command.Description;
        room.UpdatedAtUtc = DateTimeOffset.UtcNow;

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new EntityNotFound(command.Id);
        }
        catch (MissingReferenceException missing)
        {
            return new MissingReference(missing.Property, missing.Principal);
        }

        return room;
    }
}
