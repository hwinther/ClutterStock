using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Features.Rooms.AddRoom;

public class AddRoomHandler(IAppDbContext context)
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

        context.Rooms.Add(room);
        await context.SaveChangesAsync(cancellationToken);
        return room;
    }
}
