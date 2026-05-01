using System.ComponentModel.DataAnnotations;

namespace ClutterStock.Contracts.Items;

/// <summary>Request body for creating an item.</summary>
/// <param name="RoomId" example="1">Id of the room this item belongs to.</param>
/// <param name="Name" example="Vintage Lamp">Display name of the item.</param>
/// <param name="Description" example="Brass table lamp, 1980s">Optional longer description.</param>
/// <param name="Category" example="Electronics">Optional category (e.g. Electronics, Furniture).</param>
/// <param name="Notes" example="Needs new shade">Optional free-form notes.</param>
public record AddItemRequest(
    [property: Range(1, int.MaxValue)] int RoomId,
    [property: Required, StringLength(200, MinimumLength = 1)] string Name,
    [property: StringLength(2000)] string? Description,
    [property: StringLength(100)] string? Category,
    [property: StringLength(2000)] string? Notes);
