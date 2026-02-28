using System.ComponentModel.DataAnnotations;

namespace ClutterStock.Entities;

/// <summary>
/// Base class for entities that participate in optimistic concurrency.
/// Provides Id and a row version token used by EF Core for concurrency checks during updates.
/// </summary>
public abstract class ConcurrencyEntity
{
    public int Id { get; set; }

    /// <summary>
    /// Concurrency token. SQL Server updates this automatically on each row modification.
    /// EF Core uses it to detect concurrent updates and throw DbUpdateConcurrencyException.
    /// </summary>
    [Timestamp]
    public byte[] RowVersion { get; set; } = null!;
}
