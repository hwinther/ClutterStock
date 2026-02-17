using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;

namespace ClutterStock.Domain.Items.AddItem;

public class AddItemHandler(IItemRepository repository)
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
        return await repository.AddAsync(item, cancellationToken);
    }
}
