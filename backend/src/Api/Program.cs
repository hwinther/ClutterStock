using ClutterStock.Api.Extensions;
using ClutterStock.Infrastructure.Database;
using ClutterStock.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using Endpoint = ClutterStock.Domain.Features.Test.Endpoint;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(
    builder.Configuration.GetConnectionString("ClutterStock") ?? throw new InvalidOperationException("Missing connection string for ClutterStock in the configuration"));

builder.Services.AddDomainHandlers();
builder.Services.AddControllers();
// builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();
        await db.Database.MigrateAsync();
    }

    app.MapOpenApi();
    app.UseSwaggerUI(static c => c.SwaggerEndpoint("/openapi/v1.json", "ClutterStock API"));
}

app.UseHttpsRedirection();

var domainAssembly = typeof(Endpoint).Assembly ?? throw new InvalidOperationException("Domain does not have an assembly loaded");
app.MapEndpointsInAssemblies(domainAssembly!);
app.MapControllers();

app.Run();
