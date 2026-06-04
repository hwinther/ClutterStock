using ClutterStock.Domain.Abstractions;
using ClutterStock.Infrastructure.Database;
using ClutterStock.Infrastructure.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace ClutterStock.Infrastructure.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connectionString,
                                                       string? redisConnectionString = null)
    {
        // Accept either a Postgres URL (postgres[ql]://…) or native key=value Npgsql format.
        var resolved = PostgresUrlParser.Parse(connectionString);

        services.AddDbContext<ApplicationContext>(options =>
                                                      options.UseNpgsql(resolved));

        services.AddScoped<IAppDbContext>(static sp => sp.GetRequiredService<ApplicationContext>());

        AddItemChangeNotifier(services, redisConnectionString);

        return services;
    }

    private static void AddItemChangeNotifier(IServiceCollection services, string? redisConnectionString)
    {
        // Without Redis (tests, migrator, local) fall back to a no-op so item
        // mutations keep working — live updates are simply absent.
        if (string.IsNullOrWhiteSpace(redisConnectionString))
        {
            services.AddSingleton<IItemChangeNotifier, NullItemChangeNotifier>();
            return;
        }

        var options = BuildRedisOptions(redisConnectionString);
        // AbortOnConnectFail=false: connect lazily and don't crash startup if Redis
        // is down; publishing is best-effort and degrades gracefully.
        options.AbortOnConnectFail = false;
        services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(options));
        services.AddSingleton<IItemChangeNotifier, RedisItemChangeNotifier>();
    }

    /// <summary>
    ///     StackExchange.Redis does not parse <c>redis://</c> URLs natively, but the
    ///     rest of the stack (node-redis, docker-compose) uses that form. Translate a
    ///     URL into <see cref="ConfigurationOptions" />; otherwise parse the native
    ///     <c>host:port,opt=val</c> configuration string.
    /// </summary>
    private static ConfigurationOptions BuildRedisOptions(string connection)
    {
        if (!connection.Contains("://", StringComparison.Ordinal))
            return ConfigurationOptions.Parse(connection);

        var uri = new Uri(connection);
        var options = new ConfigurationOptions
        {
            EndPoints = { { uri.Host, uri.Port > 0 ? uri.Port : 6379 } },
            Ssl = string.Equals(uri.Scheme, "rediss", StringComparison.OrdinalIgnoreCase)
        };

        if (!string.IsNullOrEmpty(uri.UserInfo))
        {
            var credentials = uri.UserInfo.Split(':', 2);
            if (credentials.Length == 2)
            {
                options.User = Uri.UnescapeDataString(credentials[0]);
                options.Password = Uri.UnescapeDataString(credentials[1]);
            }
            else
            {
                options.Password = Uri.UnescapeDataString(credentials[0]);
            }
        }

        return options;
    }
}
