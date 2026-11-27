namespace ClutterStock.Domain.Abstractions;

/// <summary>The row the request named does not exist.</summary>
/// <param name="Id">The id that was looked up.</param>
public sealed record EntityNotFound(int Id);

/// <summary>The row was deleted.</summary>
/// <param name="Id">The id of the deleted row.</param>
public sealed record Deleted(int Id);

/// <summary>
///     Result of looking up one row: the row itself, or <see cref="EntityNotFound" />.
///     Handlers return it instead of <c>T?</c> or ASP.NET result types, so the domain says what
///     happened and the endpoint decides the HTTP status. A switch over it must handle every case
///     (the compiler checks this), so adding a case later breaks the build until each endpoint maps it.
/// </summary>
public union Found<T>(T, EntityNotFound);

/// <summary>Result of a delete: <see cref="Deleted" /> or <see cref="EntityNotFound" />.</summary>
public union DeleteOutcome(Deleted, EntityNotFound);
