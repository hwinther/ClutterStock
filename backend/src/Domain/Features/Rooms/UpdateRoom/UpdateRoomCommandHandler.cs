using ClutterStock.Contracts.Rooms;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Rooms.UpdateRoom;

public interface IUpdateRoomCommandHandler : ICommandHandler
{
    Task<Results<Ok<RoomResponse>, NotFound>> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id, int LocationId, string Name, string? Description);
}

public class UpdateRoomCommandHandler(IAppDbContext context) : IUpdateRoomCommandHandler
{
    public async Task<Results<Ok<RoomResponse>, NotFound>> HandleAsync(IUpdateRoomCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var room = await context.Rooms.FirstOrDefaultAsync(r => r.Id == command.Id, cancellationToken);
        if (room is null)
            return TypedResults.NotFound();

        room.LocationId = command.LocationId;
        room.Name = command.Name;
        room.Description = command.Description;
        room.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return TypedResults.Ok(room.ToResponse());
    }
}