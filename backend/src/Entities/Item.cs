namespace ClutterStock.Entities;

public class Item
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public Room Room { get; set; } = null!;
}
