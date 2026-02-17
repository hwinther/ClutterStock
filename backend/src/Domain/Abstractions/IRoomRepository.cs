using ClutterStock.Entities;

namespace ClutterStock.Domain.Abstractions;

public interface IRoomRepository
{
    Task<Room> AddAsync(Room room, CancellationToken cancellationToken = default);
}
