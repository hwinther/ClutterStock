using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Locations.DeleteLocation;

[HttpMethod(HttpVerb.Delete)]
public class DeleteLocationEndpoint : IEndpoint
{
    public static string Route => "/locations/{id}";

    public static Delegate Handler => (Func<int, IDeleteLocationCommandHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromRoute] int id,
                                              IDeleteLocationCommandHandler handler,
                                              CancellationToken cancellationToken)
    {
        var deleted = await handler.HandleAsync(new IDeleteLocationCommandHandler.Command(id), cancellationToken);
        return deleted ? Results.NoContent() : Results.NotFound();
    }
}