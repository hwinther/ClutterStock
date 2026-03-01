using ClutterStock.Contracts.Items;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Items.GetItem;

[HttpMethod(HttpVerb.Get)]
[OpenApiDescription("Returns a single item by id.")]
public class GetItemEndpoint : IEndpoint
{
    public static string Route => "/items/{id}";

    public static Delegate Handler => (Func<int, IGetItemQueryHandler, CancellationToken, Task<Results<Ok<ItemResponse>, NotFound>>>) Handle;

    private static async Task<Results<Ok<ItemResponse>, NotFound>> Handle([FromRoute] int id,
                                                                          IGetItemQueryHandler handler,
                                                                          CancellationToken cancellationToken)
    {
        var item = await handler.HandleAsync(new IGetItemQueryHandler.Query(id), cancellationToken);
        return item is null ? TypedResults.NotFound() : TypedResults.Ok(item.ToResponse());
    }
}