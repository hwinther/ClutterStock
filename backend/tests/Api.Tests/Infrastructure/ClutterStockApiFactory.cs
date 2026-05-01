using ClutterStock.Infrastructure.Database;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace ClutterStock.Api.Tests.Infrastructure;

public sealed class ClutterStockApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:16-alpine").Build();

    public async ValueTask InitializeAsync()
    {
        await _postgres.StartAsync();

        // Touching Services boots the host; ConfigureWebHost runs and the container's
        // connection string flows into AddInfrastructure(). Then apply migrations once.
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();
        await db.Database.MigrateAsync();
    }

    public override async ValueTask DisposeAsync()
    {
        await _postgres.DisposeAsync();
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // "Testing" skips the dev-time MigrateAsync() block in Program.cs — we run migrations
        // ourselves in InitializeAsync() once the container is up.
        builder.UseEnvironment("Testing");

        // Program.cs reads ConnectionStrings:ClutterStock during builder configuration (before
        // Build()), so a ConfigureAppConfiguration override would arrive too late. UseSetting
        // writes into host configuration, which WebApplication.CreateBuilder() picks up
        // synchronously, so AddInfrastructure() sees the container's real connection string.
        builder.UseSetting("ConnectionStrings:ClutterStock", _postgres.GetConnectionString());

        builder.ConfigureTestServices(services =>
        {
            services.AddAuthentication(TestAuthHandler.SchemeName)
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });
        });
    }

    /// <summary>
    ///     Empties all domain tables and resets identity sequences. Cheap (~ms) and gives every
    ///     test a clean slate without re-running migrations.
    /// </summary>
    public async Task ResetDatabaseAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();
        await db.Database.ExecuteSqlRawAsync("TRUNCATE \"Item\", \"Room\", \"Location\" RESTART IDENTITY CASCADE;");
    }
}
