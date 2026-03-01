using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Locations.DeleteLocation;

[HttpMethod(HttpVerb.Delete)]
[OpenApiDescription("Deletes a location by id.")]
public class DeleteLocationEndpoint : IEndpoint
{
    public static string Route => "/locations/{id}";

    public static Delegate Handler => (Func<int, IDeleteLocationCommandHandler, CancellationToken, Task<Results<NoContent, NotFound>>>) Handle;

    private static async Task<Results<NoContent, NotFound>> Handle([FromRoute] int id,
                                                                   IDeleteLocationCommandHandler handler,
                                                                   CancellationToken cancellationToken)
    {
        var deleted = await handler.HandleAsync(new IDeleteLocationCommandHandler.Command(id), cancellationToken);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }
}