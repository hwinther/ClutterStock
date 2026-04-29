using Swashbuckle.AspNetCore.SwaggerUI;

namespace ClutterStock.Api.Extensions;

internal static class OpenApiApplicationExtensions
{
    public static WebApplication UseOpenApiDocumentation(this WebApplication app)
    {
        app.MapOpenApi().AllowAnonymous();
        app.UseSwagger();

        app.UseSwaggerUI(options =>
        {
            options.DocExpansion(DocExpansion.None);
            options.OAuthClientId("clutterstock");
            options.OAuthUsePkce();
        });
        app.UseReDoc(static options => { options.DocumentTitle = "ClutterStock API v1"; });

        return app;
    }
}