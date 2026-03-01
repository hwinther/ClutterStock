using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Rooms.UpdateRoom;

public interface IUpdateRoomCommandHandler : ICommandHandler
{
    record Command(int Id, int LocationId, string Name, string? Description);

    Task<IResult> HandleAsync(Command command, CancellationToken cancellationToken = default);
}

public class UpdateRoomCommandHandler(IAppDbContext context) : IUpdateRoomCommandHandler
{
    public async Task<IResult> HandleAsync(IUpdateRoomCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var room = await context.Rooms.FirstOrDefaultAsync(r => r.Id == command.Id, cancellationToken);
        if (room is null)
            return Results.NotFound();

        room.LocationId = command.LocationId;
        room.Name = command.Name;
        room.Description = command.Description;
        room.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await context.SaveChangesAsync(cancellationToken);
        return Results.Ok(room);
    }
}
