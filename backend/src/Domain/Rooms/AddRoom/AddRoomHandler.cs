using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Rooms.AddRoom;

public class AddRoomHandler(IRoomRepository repository)
{
    public async Task<Room> HandleAsync(AddRoomCommand command, CancellationToken cancellationToken = default)
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

        return await repository.AddAsync(room, cancellationToken);
    }
}
