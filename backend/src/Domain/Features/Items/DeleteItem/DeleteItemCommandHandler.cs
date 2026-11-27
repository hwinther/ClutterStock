using ClutterStock.Domain.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Items.DeleteItem;

public interface IDeleteItemCommandHandler : ICommandHandler
{
    Task<DeleteOutcome> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id);
}

public class DeleteItemCommandHandler(IAppDbContext context, IItemChangeNotifier notifier) : IDeleteItemCommandHandler
{
    public async Task<DeleteOutcome> HandleAsync(IDeleteItemCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var item = await context.Items.FirstOrDefaultAsync(i => i.Id == command.Id, cancellationToken);
        if (item is null)
            return new EntityNotFound(command.Id);

        var roomId = item.RoomId;
        context.Items.Remove(item);
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new EntityNotFound(command.Id);
        }

        await notifier.PublishAsync(new ItemDeleted(command.Id, roomId), cancellationToken);
        return new Deleted(command.Id);
    }
}
