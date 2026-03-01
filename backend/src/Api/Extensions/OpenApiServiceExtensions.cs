using System.Reflection;
using ClutterStock.Api.Filters;
using ClutterStock.Contracts.Items;
using Microsoft.OpenApi;

namespace ClutterStock.Api.Extensions;

internal static class OpenApiServiceExtensions
{
    public static IServiceCollection AddOpenApiDocumentation(this IServiceCollection services, IHostEnvironment _)
    {
        services.AddOpenApi();
        services.AddSwaggerGen(static options =>
        {
            options.CustomSchemaIds(static type => type.FullName?.Replace("+", ".") ?? type.Name);

            options.SwaggerDoc("v1",
                               new OpenApiInfo
                               {
                                   Version = "v1",
                                   Title = "ClutterStock API",
                                   Description = "Because \"somewhere in the garage\" isn't a location. Home inventory for your actual clutter—electronics, parts, homelab and all."
                               });

            var apiXml = Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
            if (File.Exists(apiXml))
                options.IncludeXmlComments(apiXml);

            var contractsAssembly = typeof(AddItemRequest).Assembly;
            var contractsXml = Path.Combine(AppContext.BaseDirectory, $"{contractsAssembly.GetName().Name}.xml");
            if (File.Exists(contractsXml))
                options.IncludeXmlComments(contractsXml);

            options.OperationFilter<GlobalResponsesOperationFilter>();
        });

        return services;
    }
}