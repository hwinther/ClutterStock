using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace ClutterStock.Api.Filters;

/// <summary>
///     Endpoint filter that runs <see cref="System.ComponentModel.DataAnnotations" /> validation
///     on every endpoint argument. Returns an RFC 7807 <c>ValidationProblemDetails</c> response
///     when validation fails. Applied group-wide by the endpoint source generator.
/// </summary>
/// <remarks>
///     This filter is the project's validation strategy because the .NET 10 minimal-API
///     <c>AddValidation()</c> source generator can't statically resolve our endpoints — they
///     are mapped via <c>MapPost(route, EndpointType.Handler)</c> where <c>Handler</c> is a
///     <see cref="Delegate" />-typed property. The generator skips such call sites and emits
///     no validatable-type info, leaving validation as a no-op.
/// </remarks>
internal sealed class DataAnnotationsValidationFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var parameters = context.HttpContext.GetEndpoint()
                                ?.Metadata
                                .GetMetadata<MethodInfo>()
                                ?.GetParameters();

        Dictionary<string, List<string>>? errors = null;

        for (var i = 0; i < context.Arguments.Count; i++)
        {
            var argument = context.Arguments[i];
            if (argument is null)
                continue;

            var parameter = parameters is not null && i < parameters.Length ? parameters[i] : null;
            ValidateArgument(argument, parameter, ref errors);
        }

        if (errors is not null)
        {
            var formatted = errors.ToDictionary(static kv => kv.Key, static kv => kv.Value.ToArray());
            return Results.ValidationProblem(formatted);
        }

        return await next(context);
    }

    private static void ValidateArgument(object argument, ParameterInfo? parameter, ref Dictionary<string, List<string>>? errors)
    {
        if (IsSimpleType(argument.GetType()))
        {
            if (parameter is null)
                return;

            var attributes = parameter.GetCustomAttributes<ValidationAttribute>(inherit: true).ToArray();
            if (attributes.Length == 0)
                return;

            var results = new List<ValidationResult>();
            var ctx = new ValidationContext(argument)
            {
                MemberName = parameter.Name
            };
            if (Validator.TryValidateValue(argument, ctx, results, attributes))
                return;

            AddResults(results, parameter.Name ?? string.Empty, ref errors);
            return;
        }

        var objectResults = new List<ValidationResult>();
        var objectContext = new ValidationContext(argument);
        if (Validator.TryValidateObject(argument, objectContext, objectResults, validateAllProperties: true))
            return;

        AddResults(objectResults, fallbackKey: argument.GetType().Name, ref errors);
    }

    private static void AddResults(IEnumerable<ValidationResult> results, string fallbackKey, ref Dictionary<string, List<string>>? errors)
    {
        foreach (var result in results)
        {
            var message = result.ErrorMessage ?? "Invalid value";
            var members = result.MemberNames.Any() ? result.MemberNames : [fallbackKey];
            foreach (var member in members)
            {
                errors ??= new Dictionary<string, List<string>>();
                if (!errors.TryGetValue(member, out var list))
                    errors[member] = list = [];
                list.Add(message);
            }
        }
    }

    private static bool IsSimpleType(Type type)
    {
        var underlying = Nullable.GetUnderlyingType(type) ?? type;
        return underlying.IsPrimitive
               || underlying.IsEnum
               || underlying == typeof(string)
               || underlying == typeof(decimal)
               || underlying == typeof(DateTime)
               || underlying == typeof(DateTimeOffset)
               || underlying == typeof(TimeSpan)
               || underlying == typeof(Guid);
    }
}
