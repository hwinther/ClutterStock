using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace ClutterStock.Api.ExceptionHandlers;

/// <summary>
///     An update or delete whose row another request deleted after this one loaded it: the save
///     affects 0 rows and EF Core throws <see cref="DbUpdateConcurrencyException" /> (found by the ZAP
///     API scan, which sends PUT and DELETE for the same id in parallel). The entities have no
///     concurrency tokens, so a deleted row is the only cause, and the answer is what the request
///     would have got a moment later: 404.
/// </summary>
internal sealed class ConcurrentDeleteExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not DbUpdateConcurrencyException)
            return false;

        await Results.Problem(statusCode: StatusCodes.Status404NotFound,
                              title: "Not found",
                              detail: "It was deleted while this request was being handled.")
                     .ExecuteAsync(httpContext);
        return true;
    }
}
