using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Abstractions;

public interface IAppDbContext
{
    DbSet<Location> Locations { get; }
    DbSet<Room> Rooms { get; }
    DbSet<Item> Items { get; }

    /// <summary>Saves the tracked changes.</summary>
    /// <exception cref="MissingReferenceException">A foreign key points at a row that does not exist.</exception>
    /// <exception cref="DbUpdateConcurrencyException">
    ///     A row to update or delete is gone (another request deleted it after this one loaded it).
    ///     The entities have no concurrency tokens, so that is the only cause.
    /// </exception>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}