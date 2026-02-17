namespace ClutterStock.Domain.Rooms.AddRoom;

public record AddRoomCommand(int LocationId, string Name, string? Description);
