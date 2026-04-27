using System.Data;
using System.Data.Common;
using ClutterStock.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Api.Tests.Database;

[Collection("ApplicationContext")]
public class ApplicationContextTests : IAsyncLifetime, IAsyncDisposable
{
    private ApplicationContext _context = null!;
    private PostgreSqlDefaultConfiguration _postgreSqlContainer = null!;

    public async ValueTask DisposeAsync()
    {
        await _context.DisposeAsync();
        await _postgreSqlContainer.DisposeAsync();
    }

    public async ValueTask InitializeAsync()
    {
        _postgreSqlContainer = new PostgreSqlDefaultConfiguration();
        await _postgreSqlContainer.InitializeAsync();

        var connectionString = _postgreSqlContainer.PostgreSqlContainer.GetConnectionString();
        var options = new DbContextOptionsBuilder<ApplicationContext>()
                      .UseNpgsql(connectionString)
                      .Options;

        _context = new ApplicationContext(options);
        await _context.Database.MigrateAsync(CancellationToken.None);
    }

    [Fact]
    public void ConnectionState_ReturnsOpen()
    {
        using DbConnection connection = new Npgsql.NpgsqlConnection(_postgreSqlContainer.PostgreSqlContainer.GetConnectionString());
        connection.Open();
        Assert.Equal(ConnectionState.Open, connection.State);
    }

    [Fact]
    public void ApplicationContextMigrate_CreatesSchema()
    {
        Assert.Equal(0, _context.Locations.Count());
        Assert.Equal(0, _context.Rooms.Count());
        Assert.Equal(0, _context.Items.Count());
    }
}
