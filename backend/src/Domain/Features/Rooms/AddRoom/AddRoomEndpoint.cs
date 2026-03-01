using ClutterStock.Contracts.Rooms;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Rooms.AddRoom;

[HttpMethod(HttpVerb.Post)]
[OpenApiDescription("Creates a new room.")]
public class AddRoomEndpoint : IEndpoint
{
    public static string Route => "/rooms";

    public static Delegate Handler => (Func<AddRoomRequest, IAddRoomCommandHandler, CancellationToken, Task<Created<RoomResponse>>>) Handle;

    private static async Task<Created<RoomResponse>> Handle([FromBody] AddRoomRequest request,
                                                            IAddRoomCommandHandler handler,
                                                            CancellationToken cancellationToken)
    {
        var command = new IAddRoomCommandHandler.Command(request.LocationId, request.Name, request.Description);
        var room = await handler.HandleAsync(command, cancellationToken);
        return TypedResults.Created($"/rooms/{room.Id}", room.ToResponse());
    }
}