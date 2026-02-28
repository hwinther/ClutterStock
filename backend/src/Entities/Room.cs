namespace ClutterStock.Entities;

public class Room : ConcurrencyEntity
{
    public int LocationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public Location Location { get; set; } = null!;
    public ICollection<Item> Items { get; set; } = new List<Item>();
}
