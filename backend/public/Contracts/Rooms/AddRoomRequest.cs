using System.ComponentModel.DataAnnotations;

namespace ClutterStock.Contracts.Rooms;

/// <summary>Request body for creating a room.</summary>
/// <param name="LocationId" example="1">Id of the parent location.</param>
/// <param name="Name" example="Living Room">Display name of the room (e.g. Living Room, Garage).</param>
/// <param name="Description" example="Main gathering space">Optional description of the room.</param>
public record AddRoomRequest(
    [property: Range(1, int.MaxValue)] int LocationId,
    [property: Required, StringLength(200, MinimumLength = 1)] string Name,
    [property: StringLength(2000)] string? Description);
