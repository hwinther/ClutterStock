using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Rooms.UpdateRoom;

public interface IUpdateRoomCommandHandler : ICommandHandler
{
    Task<Found<Room>> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id, int LocationId, string Name, string? Description);
}

public class UpdateRoomCommandHandler(IAppDbContext context) : IUpdateRoomCommandHandler
{
    public async Task<Found<Room>> HandleAsync(IUpdateRoomCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var room = await context.Rooms.FirstOrDefaultAsync(r => r.Id == command.Id, cancellationToken);
        if (room is null)
            return new EntityNotFound(command.Id);

        room.LocationId = command.LocationId;
        room.Name = command.Name;
        room.Description = command.Description;
        room.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return room;
    }
}
