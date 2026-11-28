namespace ClutterStock.Domain.Abstractions;

/// <summary>
///     Thrown by <see cref="IAppDbContext.SaveChangesAsync" /> when an insert or update stores a
///     foreign key that points nowhere. The infrastructure translates the database error into this
///     so handlers can turn it into a <see cref="MissingReference" /> outcome without knowing the
///     database. The database is the authority: checking every reference first would cost a query
///     per key and still race a concurrent delete.
/// </summary>
public sealed class MissingReferenceException(string property, string principal, Exception innerException)
    : Exception($"{property} points at a {principal} row that does not exist.", innerException)
{
    /// <summary>The entity property holding the key, e.g. <c>RoomId</c>.</summary>
    public string Property { get; } = property;

    /// <summary>The table the key points at, e.g. <c>Rooms</c>.</summary>
    public string Principal { get; } = principal;
}
