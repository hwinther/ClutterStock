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
            UpdatedAtUtc = DateTime.UtcNow,
            RowVersion = new byte[]
            {
            }
        };

        var b = a with
        {
            Id = 2
        };

        Entities.Item itemEntity = b;

        // Convert entity → record (implicit operator), then use record's 'with'
        Item itemRecord = itemEntity;
        var test2 = itemRecord with { Id = 100 };

        //var test3 = new Item
        //{
        //};
    }
}