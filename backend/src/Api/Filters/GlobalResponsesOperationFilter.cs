using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace ClutterStock.Api.Filters;

internal sealed class GlobalResponsesOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        if (operation.Responses is not { } responses)
            operation.Responses = responses = new OpenApiResponses();

        responses.TryAdd("500",
                         new OpenApiResponse
                         {
                             Description = "Server Error",
                             Content = new Dictionary<string, OpenApiMediaType>
                             {
                                 ["application/problem+json"] = new()
                                 {
                                     Schema = context.SchemaGenerator.GenerateSchema(typeof(ProblemDetails), context.SchemaRepository)
                                 }
                             }
                         });
    }
}