using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Rooms.GetRoom;

[HttpMethod(HttpVerb.Get)]
public class GetRoomEndpoint : IEndpoint
{
    public static string Route => "/rooms/{id}";

    public static Delegate Handler => (Func<int, IGetRoomQueryHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromRoute] int id,
                                              IGetRoomQueryHandler handler,
                                              CancellationToken cancellationToken)
    {
        var room = await handler.HandleAsync(new IGetRoomQueryHandler.Query(id), cancellationToken);
        return room is null ? Results.NotFound() : Results.Ok(room);
    }
}