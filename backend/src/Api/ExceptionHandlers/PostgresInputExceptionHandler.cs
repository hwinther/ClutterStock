using Microsoft.AspNetCore.Diagnostics;
using Npgsql;

namespace ClutterStock.Api.ExceptionHandlers;

/// <summary>
///     Text Postgres can't store (<c>22021</c>/<c>22P05</c>) becomes a 400 instead of a 500 (found by
///     the ZAP API scan), as a safety net behind the validation filter's NUL check. Expected outcomes
///     such as a missing row or a foreign key that points nowhere are not exceptions here: the
///     handlers return them as outcome unions (see <c>Domain/Abstractions/Outcomes.cs</c>).
/// </summary>
internal sealed class PostgresInputExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var postgres = FindPostgresException(exception);
        if (postgres?.SqlState is not (PostgresErrorCodes.CharacterNotInRepertoire or PostgresErrorCodes.UntranslatableCharacter))
            return false;

        await Results.Problem(statusCode: StatusCodes.Status400BadRequest,
                              title: "Invalid text",
                              detail: "The request contains characters that can't be stored.")
                     .ExecuteAsync(httpContext);

        return true;
    }

    private static PostgresException? FindPostgresException(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException)
        {
            if (current is PostgresException postgres)
                return postgres;
        }

        return null;
    }
}
