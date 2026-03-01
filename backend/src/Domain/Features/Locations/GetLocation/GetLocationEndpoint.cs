using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Locations.GetLocation;

[HttpMethod(HttpVerb.Get)]
public class GetLocationEndpoint : IEndpoint
{
    public static string Route => "/locations/{id}";

    public static Delegate Handler => (Func<int, IGetLocationQueryHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromRoute] int id,
                                              IGetLocationQueryHandler handler,
                                              CancellationToken cancellationToken)
    {
        var location = await handler.HandleAsync(new IGetLocationQueryHandler.Query(id), cancellationToken);
        return location is null ? Results.NotFound() : Results.Ok(location);
    }
}