using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;

namespace ClutterStock.Domain.Features.Locations.GetLocations;

[HttpMethod(HttpVerb.Get)]
public class GetLocationsEndpoint : IEndpoint
{
    public static string Route => "/locations";

    public static Delegate Handler =>
        (Func<IGetLocationsQueryHandler, CancellationToken, Task<IResult>>)Handle;

    private static async Task<IResult> Handle(
        IGetLocationsQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var locations = await handler.HandleAsync(cancellationToken);
        return Results.Ok(locations);
    }
}
