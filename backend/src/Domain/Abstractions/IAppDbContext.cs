using ClutterStock.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Domain.Abstractions;

public interface IAppDbContext
{
    DbSet<Location> Locations { get; }
    DbSet<Room> Rooms { get; }
    DbSet<Item> Items { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
