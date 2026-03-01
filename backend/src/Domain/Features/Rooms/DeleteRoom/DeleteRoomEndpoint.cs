using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Rooms.DeleteRoom;

[HttpMethod(HttpVerb.Delete)]
[OpenApiDescription("Deletes a room by id.")]
public class DeleteRoomEndpoint : IEndpoint
{
    public static string Route => "/rooms/{id}";

    public static Delegate Handler => (Func<int, IDeleteRoomCommandHandler, CancellationToken, Task<Results<NoContent, NotFound>>>) Handle;

    private static async Task<Results<NoContent, NotFound>> Handle([FromRoute] int id,
                                                                   IDeleteRoomCommandHandler handler,
                                                                   CancellationToken cancellationToken)
    {
        var deleted = await handler.HandleAsync(new IDeleteRoomCommandHandler.Command(id), cancellationToken);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }
}