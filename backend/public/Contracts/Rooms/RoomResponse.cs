namespace ClutterStock.Contracts.Rooms;

/// <summary>Response payload for a room.</summary>
/// <param name="Id" example="1">Unique identifier of the room.</param>
/// <param name="LocationId" example="1">Id of the parent location.</param>
/// <param name="Name" example="Living Room">Display name of the room (e.g. Living Room, Garage).</param>
/// <param name="Description" example="Main gathering space">Optional description of the room.</param>
/// <param name="CreatedAtUtc" example="2024-01-15T10:30:00Z">UTC timestamp when the room was created.</param>
/// <param name="UpdatedAtUtc" example="2024-02-01T14:00:00Z">UTC timestamp when the room was last updated.</param>
public record RoomResponse(
    int Id,
    int LocationId,
    string Name,
    string? Description,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);