namespace ClutterStock.Contracts.Rooms;

/// <summary>Request body for updating a room. Id is provided in the route.</summary>
/// <param name="LocationId" example="1">Id of the parent location.</param>
/// <param name="Name" example="Living Room">Display name of the room (e.g. Living Room, Garage).</param>
/// <param name="Description" example="Main gathering space">Optional description of the room.</param>
public record UpdateRoomRequest(int LocationId, string Name, string? Description);