using ClutterStock.Entities.SeedData;

namespace EntityRecordGenerator.Tests;

public static class RandomTests
{
    [Fact]
    public static void Test()
    {
        var a = new Item
        {
            Id = 0,
#if MSSQL
                RowVersion = [],
#endif
            Category = "test",
            CreatedAtUtc = DateTime.UtcNow,
            Description = "desc",
            Name = "name",
            Notes = null,
            RoomId = 100,
            UpdatedAtUtc = DateTime.UtcNow
        };

        var b = a with
        {
            Id = 2
        };

        ClutterStock.Entities.Item itemEntity = b;

        // Convert entity → record (implicit operator), then use record's 'with'
        Item itemRecord = itemEntity;
        var test2 = itemRecord with
        {
            Id = 100
        };

        var test3 = Item.CreateWithExampleValues() with
        {
            Notes = "notes"
        };

        Assert.Equal("notes", test3.Notes);
        Assert.NotNull(test3.Name);
    }
}