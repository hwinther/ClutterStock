using ClutterStock.Contracts.Items;
using ClutterStock.Domain.Abstractions;
using ClutterStock.Domain.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace ClutterStock.Domain.Features.Items.GetItems;

[HttpMethod(HttpVerb.Get)]
[OpenApiDescription("Returns all items.")]
public class GetItemsEndpoint : IEndpoint
{
    public static string Route => "/items";

    public static Delegate Handler => (Func<IGetItemsQueryHandler, CancellationToken, Task<Ok<IReadOnlyList<ItemResponse>>>>) Handle;

    private static async Task<Ok<IReadOnlyList<ItemResponse>>> Handle(IGetItemsQueryHandler handler,
                                                                      CancellationToken cancellationToken)
    {
        var items = await handler.HandleAsync(cancellationToken);
        return TypedResults.Ok((IReadOnlyList<ItemResponse>) items.Select(i => i.ToResponse())
                                                                  .ToList());
    }
}