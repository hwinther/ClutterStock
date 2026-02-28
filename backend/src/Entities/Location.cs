namespace ClutterStock.Entities;

/// <summary>
///     Represents a physical location that can contain multiple rooms.
/// </summary>
public class Location : ConcurrencyEntity
{
    /// <example>Main Building</example>
    public required string Name { get; set; }

    /// <summary>Detailed description of the location</summary>
    /// <example>Headquarters</example>
    public string? Description { get; set; }

    /// <summary>UTC timestamp when the location was created</summary>
    /// <example>generate(DateTimeOffset)</example>
    public required DateTimeOffset CreatedAtUtc { get; set; }

    /// <summary>UTC timestamp when the location was last updated</summary>
    public DateTimeOffset? UpdatedAtUtc { get; set; }

    /// <summary>Collection of rooms within this location</summary>
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}