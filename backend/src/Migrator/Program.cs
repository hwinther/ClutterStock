using ClutterStock.Infrastructure.Database;
using ClutterStock.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;

// Usage: Migrator [connection-string] [--target <migration>]
//   no --target  apply every pending migration (what the API pod's initContainer runs)
//   --target X   migrate up or down to migration X (its name or full id): a manual, one-off step,
//                see "Migrations" in deploy/README.md
var (connectionArgument, target) = ParseArguments(args);
var connectionString = ResolveConnectionString(connectionArgument);

var services = new ServiceCollection();
services.AddInfrastructure(connectionString);

await using var provider = services.BuildServiceProvider();
await using var scope = provider.CreateAsyncScope();

var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();

if (target is null)
{
    Console.WriteLine("Applying database migrations...");
    await db.Database.MigrateAsync();
    Console.WriteLine("Database migration completed successfully.");
    return;
}

var migrationId = ResolveMigrationId(db, target);
var applied = (await db.Database.GetAppliedMigrationsAsync()).ToList();
Console.WriteLine($"Database is at: {(applied.Count == 0 ? "(no migrations)" : applied[^1])}");
if (applied.Count > 0 && applied[^1] == migrationId)
{
    Console.WriteLine($"Already at {migrationId}; nothing to do.");
    return;
}

Console.WriteLine(applied.Contains(migrationId)
                      ? $"Reverting to {migrationId} (runs the Down() of every later migration)..."
                      : $"Migrating up to {migrationId}...");
await db.GetService<IMigrator>().MigrateAsync(migrationId);
Console.WriteLine($"Database is now at {migrationId}.");

static (string? Connection, string? Target) ParseArguments(string[] args)
{
    string? connection = null;
    string? target = null;
    for (var i = 0; i < args.Length; i++)
    {
        if (args[i] == "--target")
        {
            if (i + 1 >= args.Length || string.IsNullOrWhiteSpace(args[i + 1]))
                throw new ArgumentException("--target needs a migration name or id.");

            target = args[++i].Trim();
        }
        else if (args[i].StartsWith("--", StringComparison.Ordinal))
            throw new ArgumentException($"Unknown option {args[i]}. Usage: Migrator [connection-string] [--target <migration>]");
        else if (connection is null)
            connection = args[i];
        else
            throw new ArgumentException("Only one connection string argument is allowed.");
    }

    return (connection, target);
}

// The target by full id (20260427212353_Init) or by name (Init). "0" (revert everything) is refused:
// it runs Init's Down() and drops the whole schema, data included.
static string ResolveMigrationId(DbContext db, string target)
{
    if (target == "0")
        throw new InvalidOperationException("Target \"0\" would revert every migration and drop the whole schema; the migrator refuses it.");

    var ids = db.Database.GetMigrations().ToList();
    var matches = ids.Where(id => id == target || id.EndsWith($"_{target}", StringComparison.Ordinal)).ToList();
    return matches.Count switch
    {
        1 => matches[0],
        0 => throw new InvalidOperationException($"No migration named \"{target}\". Known migrations: {string.Join(", ", ids)}"),
        _ => throw new InvalidOperationException($"\"{target}\" matches several migrations ({string.Join(", ", matches)}); use the full id.")
    };
}

static string ResolveConnectionString(string? argument)
{
    if (!string.IsNullOrWhiteSpace(argument))
        return argument.Trim();

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
