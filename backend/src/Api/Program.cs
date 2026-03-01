using ClutterStock.Api.Generated;
using ClutterStock.Contracts.Items;
using ClutterStock.Infrastructure.Database;
using ClutterStock.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerUI;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(
    builder.Configuration.GetConnectionString("ClutterStock") ?? throw new InvalidOperationException("Missing connection string for ClutterStock in the configuration"));

builder.Services.AddDomainHandlers();
builder.Services.AddControllers();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddOpenApi();

    // Not really required now that we have the OpenAPI support, but keeping it for now in case we want to use some of the additional features from Swashbuckle that aren't supported by the built-in OpenAPI generator.
    builder.Services.AddSwaggerGen(static options =>
    {
        options.CustomSchemaIds(static type => type.FullName?.Replace("+", ".") ?? type.Name);

        options.SwaggerDoc("v1",
                           new OpenApiInfo
                           {
                               Version = "v1",
                               Title = "ClutterStock API",
                               Description = "Because “somewhere in the garage” isn’t a location. Home inventory for your actual clutter—electronics, parts, homelab and all.",
                           });

        var apiXml = Path.Combine(AppContext.BaseDirectory, $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
        if (File.Exists(apiXml))
            options.IncludeXmlComments(apiXml);

        var contractsAssembly = typeof(AddItemRequest).Assembly;
        var contractsXml = Path.Combine(AppContext.BaseDirectory, $"{contractsAssembly.GetName().Name}.xml");
        if (File.Exists(contractsXml))
            options.IncludeXmlComments(contractsXml);
    });
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();
        await db.Database.MigrateAsync();
    }

    app.MapOpenApi();
    app.UseSwagger();

    app.UseSwaggerUI(static options =>
    {
        options.DocExpansion(DocExpansion.None);
        // options.SwaggerEndpoint("/openapi/v1.json", "ClusterStock API v1");
    });

    app.UseReDoc(static options =>
    {
        options.DocumentTitle = "ClutterStock API v1";
        // options.SpecUrl("/openapi/v1.json");
    });
}

app.UseHttpsRedirection();

app.MapDiscoveredEndpoints();
app.MapControllers();

app.Run();