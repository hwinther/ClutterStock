using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Items.GetItem;

[HttpMethod(HttpVerb.Get)]
public class GetItemEndpoint : IEndpoint
{
    public static string Route => "/items/{id}";

    public static Delegate Handler => (Func<int, IGetItemQueryHandler, CancellationToken, Task<IResult>>) Handle;

    private static async Task<IResult> Handle([FromRoute] int id,
                                              IGetItemQueryHandler handler,
                                              CancellationToken cancellationToken)
    {
        var item = await handler.HandleAsync(new IGetItemQueryHandler.Query(id), cancellationToken);
        return item is null ? Results.NotFound() : Results.Ok(item);
    }
}