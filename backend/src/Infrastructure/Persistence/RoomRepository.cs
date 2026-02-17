using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Infrastructure.Persistence;

public class RoomRepository(AppDbContext context) : IRoomRepository
{
    public async Task<Room> AddAsync(Room room, CancellationToken cancellationToken = default)
    {
        context.Rooms.Add(room);
        await context.SaveChangesAsync(cancellationToken);
        return room;
    }
}
