using ClutterStock.Infrastructure.Database;
using ClutterStock.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

var connectionString = ResolveConnectionString(args);

var services = new ServiceCollection();
services.AddInfrastructure(connectionString);

await using var provider = services.BuildServiceProvider();
await using var scope = provider.CreateAsyncScope();

var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();

Console.WriteLine("Applying database migrations...");
await db.Database.MigrateAsync();
Console.WriteLine("Database migration completed successfully.");

static string ResolveConnectionString(string[] args)
{
    if (args.Length > 0 && !string.IsNullOrWhiteSpace(args[0]))
        return args[0]
            .Trim();

    var fromConnectionStrings = Environment.GetEnvironmentVariable("ConnectionStrings__ClutterStock");
    if (!string.IsNullOrWhiteSpace(fromConnectionStrings))
        return fromConnectionStrings.Trim();

    var fromDedicatedVariable = Environment.GetEnvironmentVariable("CLUTTERSTOCK_CONNECTION_STRING");
    if (!string.IsNullOrWhiteSpace(fromDedicatedVariable))
        return fromDedicatedVariable.Trim();

    throw new InvalidOperationException(
        "Missing database connection string. Provide it as the first argument, " +
        "ConnectionStrings__ClutterStock, or CLUTTERSTOCK_CONNECTION_STRING.");
}