using Swashbuckle.AspNetCore.SwaggerUI;

namespace ClutterStock.Api.Extensions;

internal static class OpenApiApplicationExtensions
{
    public static WebApplication UseOpenApiDocumentation(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
            return app;

        app.MapOpenApi();
        app.UseSwagger();

        app.UseSwaggerUI(static options => { options.DocExpansion(DocExpansion.None); });

        app.UseReDoc(static options => { options.DocumentTitle = "ClutterStock API v1"; });

        return app;
    }
}