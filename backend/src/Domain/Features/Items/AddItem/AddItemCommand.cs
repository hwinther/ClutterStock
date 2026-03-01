namespace ClutterStock.Domain.Features.Items.AddItem;

public record AddItemCommand(int RoomId, string Name, string? Description, string? Category, string? Notes);
