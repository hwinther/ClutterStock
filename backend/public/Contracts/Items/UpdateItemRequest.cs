namespace ClutterStock.Contracts.Items;

/// <summary>Request body for updating an item. Id is provided in the route.</summary>
/// <param name="RoomId" example="1">Id of the room this item belongs to.</param>
/// <param name="Name" example="Vintage Lamp">Display name of the item.</param>
/// <param name="Description" example="Brass table lamp, 1980s">Optional longer description.</param>
/// <param name="Category" example="Electronics">Optional category (e.g. Electronics, Furniture).</param>
/// <param name="Notes" example="Needs new shade">Optional free-form notes.</param>
public record UpdateItemRequest(
    int RoomId,
    string Name,
    string? Description,
    string? Category,
    string? Notes);