using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Features.Items.UpdateItem;

public interface IUpdateItemCommandHandler : ICommandHandler
{
    Task<UpdateOutcome<Item>> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int Id, int RoomId, string Name, string? Description, string? Category, string? Notes);
}

public class UpdateItemCommandHandler(IAppDbContext context, IItemChangeNotifier notifier) : IUpdateItemCommandHandler
{
    public async Task<UpdateOutcome<Item>> HandleAsync(IUpdateItemCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var item = await context.Items.FirstOrDefaultAsync(i => i.Id == command.Id, cancellationToken);
        if (item is null)
            return new EntityNotFound(command.Id);

        item.RoomId = command.RoomId;
        item.Name = command.Name;
        item.Description = command.Description;
        item.Category = command.Category;
        item.Notes = command.Notes;
        item.UpdatedAtUtc = DateTimeOffset.UtcNow;

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return new EntityNotFound(command.Id);
        }
        catch (MissingReferenceException missing)
        {
            return new MissingReference(missing.Property, missing.Principal);
        }

        await notifier.PublishAsync(new ItemUpdated(item.Id, item.RoomId), cancellationToken);
        return item;
    }
}
