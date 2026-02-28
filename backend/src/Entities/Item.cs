namespace ClutterStock.Entities;

public class Item : ConcurrencyEntity
{
    /// <summary>
    /// Gets or sets the unique identifier for the room.
    /// </summary>
    /// <remarks>The RoomId is used to identify a specific room within the system. It is essential for
    /// operations that require room identification, such as booking or querying room details.</remarks>
    /// <example>100</example>
    public int RoomId { get; set; }

    /// <summary>
    /// Gets or sets the name associated with the current instance.
    /// </summary>
    /// <remarks>The name is initialized to an empty string. It can be used to represent a descriptive
    /// identifier for the object.</remarks>
    /// <example>Office</example>
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? Category { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public Room Room { get; set; } = null!;
}
