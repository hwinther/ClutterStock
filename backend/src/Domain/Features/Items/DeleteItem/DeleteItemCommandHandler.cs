using ClutterStock.Domain.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Items.DeleteItem;

public interface IDeleteItemCommandHandler : ICommandHandler
{
    Task<bool> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id);
}

public class DeleteItemCommandHandler(IAppDbContext context, IItemChangeNotifier notifier) : IDeleteItemCommandHandler
{
    public async Task<bool> HandleAsync(IDeleteItemCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var item = await context.Items.FirstOrDefaultAsync(i => i.Id == command.Id, cancellationToken);
        if (item is null)
            return false;

        var roomId = item.RoomId;
        context.Items.Remove(item);
        await context.SaveChangesAsync(cancellationToken);
        await notifier.PublishAsync(new ItemChange("item.deleted", command.Id, roomId), cancellationToken);
        return true;
    }
}