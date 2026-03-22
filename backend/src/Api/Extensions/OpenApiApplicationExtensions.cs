using Swashbuckle.AspNetCore.SwaggerUI;

namespace ClutterStock.Api.Extensions;

internal static class OpenApiApplicationExtensions
{
    public static WebApplication UseOpenApiDocumentation(this WebApplication app)
    {
        app.MapOpenApi();
        app.UseSwagger();

        app.UseSwaggerUI(static options => { options.DocExpansion(DocExpansion.None); });
        app.UseReDoc(static options => { options.DocumentTitle = "ClutterStock API v1"; });

        return app;
    }
}