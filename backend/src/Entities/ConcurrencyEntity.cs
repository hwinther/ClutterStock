using System.ComponentModel.DataAnnotations;

namespace ClutterStock.Entities;

/// <summary>
/// Base class for entities that participate in optimistic concurrency.
/// Provides Id and a row version token used by EF Core for concurrency checks during updates.
/// </summary>
public abstract class ConcurrencyEntity
{
    /// <summary>Primary key. Use a positive integer for seed/example data.</summary>
    /// <example>1</example>
    public int Id { get; set; }

    /// <summary>
    /// Concurrency token. SQL Server updates this automatically on each row modification.
    /// EF Core uses it to detect concurrent updates and throw DbUpdateConcurrencyException.
    /// </summary>
    /// <example>0,0,0,0,0,0,0,1</example>
    [Timestamp]
    public byte[] RowVersion { get; set; } = null!;
}
