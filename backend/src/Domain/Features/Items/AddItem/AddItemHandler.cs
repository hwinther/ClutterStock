using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Features.Items.AddItem;

public class AddItemHandler(IAppDbContext context)
{
    public async Task<Item> HandleAsync(AddItemCommand command, CancellationToken cancellationToken = default)
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
            UpdatedAtUtc = now
        };

        context.Items.Add(item);
        await context.SaveChangesAsync(cancellationToken);
        return item;
    }
}
