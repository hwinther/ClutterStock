using Microsoft.AspNetCore.Authorization;
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

        var problemSchema = context.SchemaGenerator.GenerateSchema(typeof(ProblemDetails), context.SchemaRepository);
        var validationSchema = context.SchemaGenerator.GenerateSchema(typeof(HttpValidationProblemDetails), context.SchemaRepository);

        responses.TryAdd("400",
                         new OpenApiResponse
                         {
                             Description = "Bad Request",
                             Content = new Dictionary<string, IOpenApiMediaType>
                             {
                                 ["application/problem+json"] = new OpenApiMediaType
                                 {
                                     Schema = validationSchema
                                 }
                             }
                         });

        var allowAnonymous = context.ApiDescription.ActionDescriptor.EndpointMetadata
                                    .OfType<IAllowAnonymous>()
                                    .Any();

        if (!allowAnonymous)
        {
            responses.TryAdd("401",
                             new OpenApiResponse
                             {
                                 Description = "Unauthorized",
                                 Content = new Dictionary<string, IOpenApiMediaType>
                                 {
                                     ["application/problem+json"] = new OpenApiMediaType
                                     {
                                         Schema = problemSchema
                                     }
                                 }
                             });

            responses.TryAdd("403",
                             new OpenApiResponse
                             {
                                 Description = "Forbidden",
                                 Content = new Dictionary<string, IOpenApiMediaType>
                                 {
                                     ["application/problem+json"] = new OpenApiMediaType
                                     {
                                         Schema = problemSchema
                                     }
                                 }
                             });
        }

        responses.TryAdd("500",
                         new OpenApiResponse
                         {
                             Description = "Server Error",
                             Content = new Dictionary<string, IOpenApiMediaType>
                             {
                                 ["application/problem+json"] = new OpenApiMediaType
                                 {
                                     Schema = problemSchema
                                 }
                             }
                         });
    }
}