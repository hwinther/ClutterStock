namespace ClutterStock.Contracts.Items;

/// <summary>Response payload for an item.</summary>
/// <param name="Id" example="1">Unique identifier of the item.</param>
/// <param name="RoomId" example="1">Id of the room this item belongs to.</param>
/// <param name="Name" example="Vintage Lamp">Display name of the item.</param>
/// <param name="Description" example="Brass table lamp, 1980s">Optional longer description.</param>
/// <param name="Category" example="Electronics">Optional category (e.g. Electronics, Furniture).</param>
/// <param name="Notes" example="Needs new shade">Optional free-form notes.</param>
/// <param name="CreatedAtUtc" example="2024-01-15T10:30:00Z">UTC timestamp when the item was created.</param>
/// <param name="UpdatedAtUtc" example="2024-02-01T14:00:00Z">UTC timestamp when the item was last updated.</param>
public record ItemResponse(
    int Id,
    int RoomId,
    string Name,
    string? Description,
    string? Category,
    string? Notes,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);