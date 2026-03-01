using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Rooms.GetRoom;

public interface IGetRoomQueryHandler : IQueryHandler
{
    record Query(int Id);

    Task<Room?> HandleAsync(Query query, CancellationToken cancellationToken = default);
}

public class GetRoomQueryHandler(IAppDbContext context) : IGetRoomQueryHandler
{
    public async Task<Room?> HandleAsync(IGetRoomQueryHandler.Query query, CancellationToken cancellationToken = default)
    {
        return await context.Rooms
            .FirstOrDefaultAsync(r => r.Id == query.Id, cancellationToken);
    }
}
