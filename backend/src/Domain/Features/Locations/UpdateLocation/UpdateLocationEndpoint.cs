using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Locations.UpdateLocation;

[HttpMethod(HttpVerb.Put)]
public class UpdateLocationEndpoint : IEndpoint
{
    public static string Route => "/locations/{id}";

    public static Delegate Handler => (Func<IUpdateLocationCommandHandler.Command, IUpdateLocationCommandHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromBody] IUpdateLocationCommandHandler.Command command,
                                              IUpdateLocationCommandHandler handler,
                                              CancellationToken cancellationToken) =>
        await handler.HandleAsync(command, cancellationToken);
}