using Testcontainers.PostgreSql;

namespace ClutterStock.Api.Tests.Database;

public class PostgreSqlContainerTest(PostgreSqlContainer postgreSqlContainer) : IAsyncDisposable
{
    public readonly PostgreSqlContainer PostgreSqlContainer = postgreSqlContainer;
    public async ValueTask DisposeAsync() => await PostgreSqlContainer.DisposeAsync();
    public Task InitializeAsync() => PostgreSqlContainer.StartAsync();
}
