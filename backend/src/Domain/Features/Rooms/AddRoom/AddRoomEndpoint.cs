using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Rooms.AddRoom;

[HttpMethod(HttpVerb.Post)]
public class AddRoomEndpoint : IEndpoint
{
    public static string Route => "/rooms";

    public static Delegate Handler => (Func<IAddRoomCommandHandler.Command, IAddRoomCommandHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromBody] IAddRoomCommandHandler.Command command,
                                              IAddRoomCommandHandler handler,
                                              CancellationToken cancellationToken)
    {
        var room = await handler.HandleAsync(command, cancellationToken);
        return Results.Created($"/rooms/{room.Id}", room);
    }
}