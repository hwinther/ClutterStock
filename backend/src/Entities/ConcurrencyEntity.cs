namespace ClutterStock.Entities;

/// <summary>
///     Base class for entities that participate in optimistic concurrency.
///     Provides id and a row version token used by EF Core for concurrency checks during updates.
/// </summary>
public abstract class ConcurrencyEntity
{
    /// <summary>Primary key. Use a positive integer for seed/example data.</summary>
    /// <example>generate(int)</example>
    public int Id { get; set; } = 0;

#if MSSQL
    /// <summary>
    ///     Concurrency token. SQL Server updates this automatically on each row modification.
    ///     EF Core uses it to detect concurrent updates and throw DbUpdateConcurrencyException.
    /// </summary>
    /// <example>generate(byte[8])</example>
    [Timestamp]
    public byte[] RowVersion { get; set; } = [];
#endif
}