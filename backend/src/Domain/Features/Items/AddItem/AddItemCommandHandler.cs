using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Features.Items.AddItem;

public interface IAddItemCommandHandler : ICommandHandler
{
    Task<Item> HandleAsync(Command command, CancellationToken cancellationToken = default);

    record Command(int RoomId, string Name, string? Description, string? Category, string? Notes);
}

public class AddItemCommandHandler(IAppDbContext context) : IAddItemCommandHandler
{
    public async Task<Item> HandleAsync(IAddItemCommandHandler.Command command, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var item = new Item
        {
            RoomId = command.RoomId,
            Name = command.Name,
            Description = command.Description,
            Category = command.Category,
            Notes = command.Notes,
            CreatedAtUtc = now,
        };

        context.Items.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return item;
    }
}