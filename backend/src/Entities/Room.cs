namespace ClutterStock.Entities;

/// <summary>
///     Represents a room within a location that can contain multiple items.
/// </summary>
public class Room : ConcurrencyEntity
{
    /// <example>1</example>
    public required int LocationId { get; set; }

    /// <example>Living Room</example>
    public required string Name { get; set; }

    /// <summary>Detailed description of the room</summary>
    public string? Description { get; set; }

    /// <summary>UTC timestamp when the room was created</summary>
    /// <example>generate(DateTimeOffset)</example>
    public DateTimeOffset CreatedAtUtc { get; set; }

    /// <summary>UTC timestamp when the room was last updated</summary>
    public DateTimeOffset? UpdatedAtUtc { get; set; }

    /// <summary>Navigation property to the location containing this room</summary>
    public Location Location { get; set; } = null!;

    /// <summary>Collection of items within this room</summary>
    public ICollection<Item> Items { get; set; } = new List<Item>();
}