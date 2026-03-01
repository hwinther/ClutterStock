using ClutterStock.Contracts.Rooms;
using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Rooms.UpdateRoom;

[HttpMethod(HttpVerb.Put)]
[OpenApiDescription("Updates an existing room by id.")]
public class UpdateRoomEndpoint : IEndpoint
{
    public static string Route => "/rooms/{id}";

    public static Delegate Handler => (Func<int, UpdateRoomRequest, IUpdateRoomCommandHandler, CancellationToken, Task<Results<Ok<RoomResponse>, NotFound>>>) Handle;

    private static async Task<Results<Ok<RoomResponse>, NotFound>> Handle([FromRoute] int id,
                                                                          [FromBody] UpdateRoomRequest request,
                                                                          IUpdateRoomCommandHandler handler,
                                                                          CancellationToken cancellationToken)
    {
        var command = new IUpdateRoomCommandHandler.Command(id, request.LocationId, request.Name, request.Description);
        return await handler.HandleAsync(command, cancellationToken);
    }
}