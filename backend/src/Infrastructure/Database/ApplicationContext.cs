using ClutterStock.Domain.Abstractions;
using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ClutterStock.Infrastructure.Database;

public class ApplicationContext(DbContextOptions<ApplicationContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<Item> Items => Set<Item>();

    /// <inheritdoc cref="IAppDbContext.SaveChangesAsync" />
    public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        try
        {
            return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }
        catch (DbUpdateException exception) when (ToMissingReference(exception) is { } missing)
        {
            throw missing;
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationContext).Assembly);
    }

    /// <summary>
    ///     EF Core names keys <c>FK_{Dependent}_{Principal}_{Property}</c>, and Postgres reports the
    ///     dependent table when an insert or update references a missing row. (A delete that would
    ///     orphan rows reports the principal table instead; every key here cascades, so that can't
    ///     happen and is left as a plain <see cref="DbUpdateException" />.)
    /// </summary>
    private static MissingReferenceException? ToMissingReference(DbUpdateException exception)
    {
        var postgres = FindPostgresException(exception);
        if (postgres is not {SqlState: PostgresErrorCodes.ForeignKeyViolation})
            return null;

        var parts = postgres.ConstraintName?.Split('_');
        if (parts is not {Length: 4} || parts[0] != "FK" || postgres.TableName != parts[1])
            return null;

        return new MissingReferenceException(parts[3], parts[2], exception);
    }

    private static PostgresException? FindPostgresException(Exception exception)
    {
        for (var current = exception.InnerException; current is not null; current = current.InnerException)
        {
            if (current is PostgresException postgres)
                return postgres;
        }

        return null;
    }
}
