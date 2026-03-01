using ClutterStock.Contracts.Rooms;
using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Rooms.AddRoom;

[HttpMethod(HttpVerb.Post)]
[OpenApiDescription("Creates a new room.")]
public class AddRoomEndpoint : IEndpoint
{
    public static string Route => "/rooms";

    public static Delegate Handler => (Func<AddRoomRequest, IAddRoomCommandHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromBody] AddRoomRequest request,
                                              IAddRoomCommandHandler handler,
                                              CancellationToken cancellationToken)
    {
        var command = new IAddRoomCommandHandler.Command(request.LocationId, request.Name, request.Description);
        var room = await handler.HandleAsync(command, cancellationToken);
        return Results.Created($"/rooms/{room.Id}", room);
    }
}