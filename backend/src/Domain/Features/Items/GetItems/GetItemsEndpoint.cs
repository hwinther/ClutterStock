using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;

namespace ClutterStock.Domain.Features.Items.GetItems;

[HttpMethod(HttpVerb.Get)]
public class GetItemsEndpoint : IEndpoint
{
    public static string Route => "/items";

    public static Delegate Handler =>
        (Func<IGetItemsQueryHandler, CancellationToken, Task<IResult>>)Handle;

    private static async Task<IResult> Handle(
        IGetItemsQueryHandler handler,
        CancellationToken cancellationToken)
    {
        var items = await handler.HandleAsync(cancellationToken);
        return Results.Ok(items);
    }
}
