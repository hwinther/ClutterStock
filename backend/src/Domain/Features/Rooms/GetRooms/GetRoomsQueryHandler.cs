using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Rooms.GetRooms;

public interface IGetRoomsQueryHandler : IQueryHandler
{
    Task<IReadOnlyList<Room>> HandleAsync(CancellationToken cancellationToken = default);
}

public class GetRoomsQueryHandler(IAppDbContext context) : IGetRoomsQueryHandler
{
    public async Task<IReadOnlyList<Room>> HandleAsync(CancellationToken cancellationToken = default)
    {
        return await context.Rooms
                            .OrderBy(r => r.Id)
                            .ToListAsync(cancellationToken);
    }
}