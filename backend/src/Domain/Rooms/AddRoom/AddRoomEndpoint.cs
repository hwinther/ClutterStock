using Microsoft.AspNetCore.Http;

namespace ClutterStock.Domain.Rooms.AddRoom;

public class AddRoomEndpoint : IEndpoint
{
    public static string Route => "/rooms";
    public static string HttpMethod => "POST";

    public static Delegate Handler =>
        (Func<AddRoomCommand, AddRoomHandler, CancellationToken, Task<IResult>>)Handle;

    private static async Task<IResult> Handle(
        AddRoomCommand command,
        AddRoomHandler handler,
        CancellationToken cancellationToken)
    {
        var room = await handler.HandleAsync(command, cancellationToken);
        return Results.Created($"/rooms/{room.Id}", room);
    }
}
