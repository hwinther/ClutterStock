using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Features.Rooms.AddRoom;

public interface IAddRoomCommandHandler : ICommandHandler
{
    record Command(int LocationId, string Name, string? Description);

    Task<Room> HandleAsync(Command command, CancellationToken cancellationToken = default);
}

public class AddRoomCommandHandler(IAppDbContext context) : IAddRoomCommandHandler
{
    public async Task<Room> HandleAsync(IAddRoomCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var room = new Room
        {
            LocationId = command.LocationId,
            Name = command.Name,
            Description = command.Description,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        context.Rooms.Add(room);
        await context.SaveChangesAsync(cancellationToken);
        return room;
    }
}
