using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Rooms.GetRoom;

public interface IGetRoomQueryHandler : IQueryHandler
{
    Task<Found<Room>> HandleAsync(Query query, CancellationToken cancellationToken = default);

    record Query(int Id);
}

public class GetRoomQueryHandler(IAppDbContext context) : IGetRoomQueryHandler
{
    public async Task<Found<Room>> HandleAsync(IGetRoomQueryHandler.Query query, CancellationToken cancellationToken = default)
    {
        var room = await context.Rooms
                            .FirstOrDefaultAsync(r => r.Id == query.Id, cancellationToken);
        if (room is null)
            return new EntityNotFound(query.Id);

        return room;
    }
}
