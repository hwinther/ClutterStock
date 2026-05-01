using ClutterStock.Infrastructure.Database;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ClutterStock.Api.Tests.Infrastructure;

public sealed class ClutterStockApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"clutterstock-tests-{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // "Testing" disables the dev-time `Database.MigrateAsync()` block in Program.cs,
        // which would otherwise fail against the EF InMemory provider.
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration(static (_, config) =>
        {
            // AddInfrastructure() requires a non-empty Postgres connection string at startup.
            // We replace the actual DbContext registration below, but still need the parser
            // to accept *something*.
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:ClutterStock"] = "Host=localhost;Database=clutterstock;Username=test;Password=test"
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<ApplicationContext>>();
            services.RemoveAll<DbContextOptions>();

            // Isolate EF's internal services from the Npgsql provider that AddInfrastructure() registered.
            // Without this, both providers end up in the same internal service provider and EF refuses to start.
            var inMemoryServiceProvider = new ServiceCollection()
                                          .AddEntityFrameworkInMemoryDatabase()
                                          .BuildServiceProvider();

            services.AddDbContext<ApplicationContext>(options =>
                                                         options.UseInMemoryDatabase(_databaseName)
                                                                .UseInternalServiceProvider(inMemoryServiceProvider));

            services.AddAuthentication(TestAuthHandler.SchemeName)
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });
        });
    }

    public async Task ResetDatabaseAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();
        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();
    }
}
