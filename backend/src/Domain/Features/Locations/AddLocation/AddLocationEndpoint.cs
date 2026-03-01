using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Locations.AddLocation;

[HttpMethod(HttpVerb.Post)]
public class AddLocationEndpoint : IEndpoint
{
    public static string Route => "/locations";

    public static Delegate Handler =>
        (Func<IAddLocationCommandHandler.Command, IAddLocationCommandHandler, CancellationToken, Task<IResult>>)Handle;

    private static async Task<IResult> Handle(
        [FromBody] IAddLocationCommandHandler.Command command,
        IAddLocationCommandHandler handler,
        CancellationToken cancellationToken)
    {
        var location = await handler.HandleAsync(command, cancellationToken);
        return Results.Created($"/locations/{location.Id}", location);
    }
}
