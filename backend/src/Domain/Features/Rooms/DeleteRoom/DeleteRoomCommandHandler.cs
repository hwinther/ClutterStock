using ClutterStock.Domain.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Rooms.DeleteRoom;

public interface IDeleteRoomCommandHandler : ICommandHandler
{
    Task<bool> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id);
}

public class DeleteRoomCommandHandler(IAppDbContext context) : IDeleteRoomCommandHandler
{
    public async Task<bool> HandleAsync(IDeleteRoomCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var room = await context.Rooms.FirstOrDefaultAsync(r => r.Id == command.Id, cancellationToken);
        if (room is null)
            return false;

        context.Rooms.Remove(room);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}