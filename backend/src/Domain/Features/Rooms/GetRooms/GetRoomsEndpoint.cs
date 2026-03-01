using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;

namespace ClutterStock.Domain.Features.Rooms.GetRooms;

[HttpMethod(HttpVerb.Get)]
public class GetRoomsEndpoint : IEndpoint
{
    public static string Route => "/rooms";

    public static Delegate Handler =>
        (Func<IGetRoomsQueryHandler, CancellationToken, Task<IResult>>)Handle;

    private static async Task<IResult> Handle(
        IGetRoomsQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var rooms = await handler.HandleAsync(cancellationToken);
        return Results.Ok(rooms);
    }
}
