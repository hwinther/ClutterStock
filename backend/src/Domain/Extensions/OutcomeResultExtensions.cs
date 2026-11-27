using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;

namespace ClutterStock.Domain.Extensions;

public static class OutcomeResultExtensions
{
    /// <summary>
    ///     400 with a validation error on the key's property, in the same shape as the
    ///     DataAnnotations errors, e.g. <c>{"RoomId": ["The Rooms does not exist."]}</c>.
    /// </summary>
    public static ValidationProblem ToValidationProblem(this MissingReference missing) =>
        TypedResults.ValidationProblem(new Dictionary<string, string[]>
        {
            [missing.Property] = [$"The {missing.Principal} does not exist."]
        });
}
