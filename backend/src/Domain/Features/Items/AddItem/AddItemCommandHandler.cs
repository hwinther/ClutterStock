using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Features.Items.AddItem;

public interface IAddItemCommandHandler : ICommandHandler
{
    Task<AddOutcome<Item>> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int RoomId, string Name, string? Description, string? Category, string? Notes);
}

public class AddItemCommandHandler(IAppDbContext context, IItemChangeNotifier notifier) : IAddItemCommandHandler
{
    public async Task<AddOutcome<Item>> HandleAsync(IAddItemCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var item = new Item
        {
            RoomId = command.RoomId,
            Name = command.Name,
            Description = command.Description,
            Category = command.Category,
            Notes = command.Notes,
            CreatedAtUtc = now
        };

        context.Items.Add(item);
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (MissingReferenceException missing)
        {
            return new MissingReference(missing.Property, missing.Principal);
        }

        await notifier.PublishAsync(new ItemCreated(item.Id, item.RoomId), cancellationToken);
        return item;
    }
}