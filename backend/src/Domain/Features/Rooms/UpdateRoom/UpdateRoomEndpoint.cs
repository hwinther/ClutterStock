using System.ComponentModel.DataAnnotations;
using ClutterStock.Contracts.Rooms;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using ClutterStock.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Rooms.UpdateRoom;

[HttpMethod(HttpVerb.Put)]
[OpenApiDescription("Updates an existing room by id.")]
public class UpdateRoomEndpoint : IEndpoint
{
    public static string Route => "/rooms/{id}";

    public static Delegate Handler => (Func<int, UpdateRoomRequest, IUpdateRoomCommandHandler, CancellationToken, Task<Results<Ok<RoomResponse>, NotFound, ValidationProblem>>>) Handle;

    private static async Task<Results<Ok<RoomResponse>, NotFound, ValidationProblem>> Handle([FromRoute] [Range(1, int.MaxValue)] int id,
                                                                                             [FromBody] UpdateRoomRequest request,
                                                                                             IUpdateRoomCommandHandler handler,
                                                                                             CancellationToken cancellationToken)
    {
        var command = new IUpdateRoomCommandHandler.Command(id, request.LocationId, request.Name, request.Description);
        var outcome = await handler.HandleAsync(command, cancellationToken);
        return outcome switch
        {
            Room room => TypedResults.Ok(room.ToResponse()),
            EntityNotFound => TypedResults.NotFound(),
            MissingReference missing => missing.ToValidationProblem()
        };
    }
}