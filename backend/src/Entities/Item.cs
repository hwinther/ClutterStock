namespace ClutterStock.Entities;

/// <summary>
///     Represents an individual item stored within a room.
/// </summary>
public class Item : ConcurrencyEntity
{
    /// <example>100</example>
    public required int RoomId { get; set; }

    /// <example>Office</example>
    public required string Name { get; set; }

    /// <summary>Detailed description of the item</summary>
    public string? Description { get; set; }

    /// <example>Electronics</example>
    public string? Category { get; set; }

    /// <summary>Additional notes or remarks about the item</summary>
    public string? Notes { get; set; }

    /// <summary>UTC timestamp when the item was created</summary>
    /// <example>generate(DateTimeOffset)</example>
    public required DateTimeOffset CreatedAtUtc { get; set; }

    /// <summary>UTC timestamp when the item was last updated</summary>
    public DateTimeOffset? UpdatedAtUtc { get; set; }

    /// <summary>Navigation property to the room containing this item</summary>
    public Room Room { get; set; } = null!;
}