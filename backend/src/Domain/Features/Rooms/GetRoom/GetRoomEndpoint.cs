using System.ComponentModel.DataAnnotations;
using ClutterStock.Contracts.Rooms;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using ClutterStock.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Rooms.GetRoom;

[HttpMethod(HttpVerb.Get)]
[OpenApiDescription("Returns a single room by id.")]
public class GetRoomEndpoint : IEndpoint
{
    public static string Route => "/rooms/{id}";

    public static Delegate Handler => (Func<int, IGetRoomQueryHandler, CancellationToken, Task<Results<Ok<RoomResponse>, NotFound>>>) Handle;

    private static async Task<Results<Ok<RoomResponse>, NotFound>> Handle([FromRoute] [Range(1, int.MaxValue)] int id,
                                                                          IGetRoomQueryHandler handler,
                                                                          CancellationToken cancellationToken)
    {
        var outcome = await handler.HandleAsync(new IGetRoomQueryHandler.Query(id), cancellationToken);
        return outcome switch
        {
            Room room => TypedResults.Ok(room.ToResponse()),
            EntityNotFound => TypedResults.NotFound()
        };
    }
}