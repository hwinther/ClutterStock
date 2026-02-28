namespace ClutterStock.Entities;

public class Location : ConcurrencyEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
