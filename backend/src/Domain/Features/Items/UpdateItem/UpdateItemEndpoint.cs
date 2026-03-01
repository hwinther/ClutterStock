using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ClutterStock.Domain.Features.Items.UpdateItem;

[HttpMethod(HttpVerb.Put)]
public class UpdateItemEndpoint : IEndpoint
{
    public static string Route => "/items/{id}";

    public static Delegate Handler =>
        (Func<IUpdateItemCommandHandler.Command, IUpdateItemCommandHandler, CancellationToken, Task<IResult>>)Handle;

    private static async Task<IResult> Handle(
        [FromBody] IUpdateItemCommandHandler.Command command,
        IUpdateItemCommandHandler handler,
        CancellationToken cancellationToken)
    {
        return await handler.HandleAsync(command, cancellationToken);
    }
}
