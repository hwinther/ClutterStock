using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Items.DeleteItem;

[HttpMethod(HttpVerb.Delete)]
[OpenApiDescription("Deletes an item by id.")]
public class DeleteItemEndpoint : IEndpoint
{
    public static string Route => "/items/{id}";

    public static Delegate Handler => (Func<int, IDeleteItemCommandHandler, CancellationToken, Task<Results<NoContent, NotFound>>>) Handle;

    private static async Task<Results<NoContent, NotFound>> Handle([FromRoute] int id,
                                                                   IDeleteItemCommandHandler handler,
                                                                   CancellationToken cancellationToken)
    {
        var deleted = await handler.HandleAsync(new IDeleteItemCommandHandler.Command(id), cancellationToken);
        return deleted ? TypedResults.NoContent() : TypedResults.NotFound();
    }
}