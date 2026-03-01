using ClutterStock.Contracts.Rooms;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace ClutterStock.Domain.Features.Rooms.GetRooms;

[HttpMethod(HttpVerb.Get)]
[OpenApiDescription("Returns all rooms.")]
public class GetRoomsEndpoint : IEndpoint
{
    public static string Route => "/rooms";

    public static Delegate Handler => (Func<IGetRoomsQueryHandler, CancellationToken, Task<Ok<IReadOnlyList<RoomResponse>>>>) Handle;

    private static async Task<Ok<IReadOnlyList<RoomResponse>>> Handle(IGetRoomsQueryHandler handler,
                                                                      CancellationToken cancellationToken)
    {
        var rooms = await handler.HandleAsync(cancellationToken);
        return TypedResults.Ok((IReadOnlyList<RoomResponse>) rooms.Select(r => r.ToResponse())
                                                                  .ToList());
    }
}