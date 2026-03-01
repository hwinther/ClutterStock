using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Items.DeleteItem;

[HttpMethod(HttpVerb.Delete)]
public class DeleteItemEndpoint : IEndpoint
{
    public static string Route => "/items/{id}";

    public static Delegate Handler => (Func<int, IDeleteItemCommandHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromRoute] int id,
                                              IDeleteItemCommandHandler handler,
                                              CancellationToken cancellationToken)
    {
        var deleted = await handler.HandleAsync(new IDeleteItemCommandHandler.Command(id), cancellationToken);
        return deleted ? Results.NoContent() : Results.NotFound();
    }
}