namespace ClutterStock.Entities.SeedData;

public class Temp
{
    public void Test()
    {
        var a = new Item
        {
            Category = "test",
            CreatedAtUtc = DateTime.UtcNow,
            Description = "desc",
            Id = 1,
            Name = "name",
            Notes = null,
            RoomId = 100,
            UpdatedAtUtc = DateTime.UtcNow
        };

        Entities.Item itemEntity = a;
    }
}