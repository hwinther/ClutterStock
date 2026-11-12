using Microsoft.AspNetCore.Diagnostics;
using Npgsql;

namespace ClutterStock.Api.ExceptionHandlers;

/// <summary>
///     Turns the Postgres errors that bad client input causes into 4xx responses instead of 500s
///     (found by the ZAP API scan):
///     <list type="bullet">
///         <item>
///             A foreign key that points nowhere, e.g. an item whose <c>roomId</c> doesn't exist:
///             400 with a validation error on the key's property, in the same shape as the
///             DataAnnotations errors. A delete that a restricting key blocks: 409.
///         </item>
///         <item>
///             Text Postgres can't store (<c>22021</c>/<c>22P05</c>), as a safety net behind the
///             validation filter's NUL check: 400.
///         </item>
///     </list>
///     Checking these in every handler first would cost a query per reference and still race a
///     concurrent delete; the database is the authority, so this maps what it says.
/// </summary>
internal sealed class PostgresInputExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var postgres = FindPostgresException(exception);
        if (postgres is null)
            return false;

        IResult? result = postgres.SqlState switch
        {
            PostgresErrorCodes.ForeignKeyViolation => ForeignKeyViolation(postgres),
            PostgresErrorCodes.CharacterNotInRepertoire or PostgresErrorCodes.UntranslatableCharacter =>
                Results.Problem(statusCode: StatusCodes.Status400BadRequest,
                                title: "Invalid text",
                                detail: "The request contains characters that can't be stored."),
            _ => null
        };

        if (result is null)
            return false;

        await result.ExecuteAsync(httpContext);
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

    /// <summary>
    ///     EF Core names keys <c>FK_{Dependent}_{Principal}_{Property}</c>. Postgres reports the
    ///     dependent table when an insert or update references a missing row, and the principal
    ///     table when a delete would orphan rows.
    /// </summary>
    private static IResult ForeignKeyViolation(PostgresException postgres)
    {
        var parts = postgres.ConstraintName?.Split('_');
        if (parts is not { Length: 4 } || parts[0] != "FK")
            return Results.Problem(statusCode: StatusCodes.Status400BadRequest,
                                   title: "Invalid reference",
                                   detail: "The request references something that doesn't exist.");

        var (dependent, principal, property) = (parts[1], parts[2], parts[3]);
        if (postgres.TableName != dependent)
            return Results.Problem(statusCode: StatusCodes.Status409Conflict,
                                   title: "Still referenced",
                                   detail: $"This {principal} still has {dependent} rows that reference it.");

        return Results.ValidationProblem(new Dictionary<string, string[]>
        {
            [property] = [$"The {principal} does not exist."]
        });
    }
}
