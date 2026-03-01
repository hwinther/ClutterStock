using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Rooms.UpdateRoom;

[HttpMethod(HttpVerb.Put)]
public class UpdateRoomEndpoint : IEndpoint
{
    public static string Route => "/rooms/{id}";

    public static Delegate Handler => (Func<IUpdateRoomCommandHandler.Command, IUpdateRoomCommandHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromBody] IUpdateRoomCommandHandler.Command command,
                                              IUpdateRoomCommandHandler handler,
                                              CancellationToken cancellationToken) =>
        await handler.HandleAsync(command, cancellationToken);
}