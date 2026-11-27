namespace ClutterStock.Domain.Abstractions;

/// <summary>
///     The row the request named does not exist, or another request deleted it between the load
///     and the save.
/// </summary>
/// <param name="Id">The id that was looked up.</param>
public sealed record EntityNotFound(int Id);

/// <summary>The row was deleted.</summary>
/// <param name="Id">The id of the deleted row.</param>
public sealed record Deleted(int Id);

/// <summary>A foreign key in the request points at a row that does not exist.</summary>
/// <param name="Property">The entity property holding the key, e.g. <c>RoomId</c>.</param>
/// <param name="Principal">The table the key points at, e.g. <c>Rooms</c>.</param>
public sealed record MissingReference(string Property, string Principal);

/// <summary>
///     Result of looking up one row: the row itself, or <see cref="EntityNotFound" />.
///     Handlers return outcome unions instead of <c>T?</c>, <c>bool</c> or ASP.NET result types, so the
///     domain says what happened and the endpoint decides the HTTP status. A switch over a union must
///     handle every case (the compiler checks this), so adding a case breaks the build until each
///     endpoint maps it.
/// </summary>
public union Found<T>(T, EntityNotFound);

/// <summary>Result of a create whose row has foreign keys: the new row, or <see cref="MissingReference" />.</summary>
public union AddOutcome<T>(T, MissingReference);

/// <summary>
///     Result of an update whose row has foreign keys: the updated row, <see cref="EntityNotFound" />
///     (also when the row was deleted before the save), or <see cref="MissingReference" />.
/// </summary>
public union UpdateOutcome<T>(T, EntityNotFound, MissingReference);

/// <summary>
///     Result of a delete: <see cref="Deleted" />, or <see cref="EntityNotFound" /> (also when another
///     request deleted the row first).
/// </summary>
public union DeleteOutcome(Deleted, EntityNotFound);
