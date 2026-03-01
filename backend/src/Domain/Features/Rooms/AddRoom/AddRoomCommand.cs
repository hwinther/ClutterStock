namespace ClutterStock.Domain.Features.Rooms.AddRoom;

public record AddRoomCommand(int LocationId, string Name, string? Description);
