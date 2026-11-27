using ClutterStock.Domain.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Rooms.DeleteRoom;

public interface IDeleteRoomCommandHandler : ICommandHandler
{
    Task<DeleteOutcome> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id);
}

public class DeleteRoomCommandHandler(IAppDbContext context) : IDeleteRoomCommandHandler
{
    public async Task<DeleteOutcome> HandleAsync(IDeleteRoomCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var room = await context.Rooms.FirstOrDefaultAsync(r => r.Id == command.Id, cancellationToken);
        if (room is null)
            return new EntityNotFound(command.Id);

        context.Rooms.Remove(room);
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new EntityNotFound(command.Id);
        }

        return new Deleted(command.Id);
    }
}
