using ClutterStock.Api.Extensions;
using ClutterStock.Api.Generated;
using ClutterStock.Infrastructure.Database;
using ClutterStock.Infrastructure.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenTelemetryObservability(builder.Environment);

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
    {
        if (allowedOrigins.Length > 0)
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
    }));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Authentication:Authority"];
        options.Audience = builder.Configuration["Authentication:Audience"];
    });

builder.Services.AddAuthorization(options =>
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build());

builder.Services.AddInfrastructure(
    builder.Configuration.GetConnectionString("ClutterStock") ?? throw new InvalidOperationException("Missing connection string for ClutterStock in the configuration"));

builder.Services.AddHealthChecks()
       .AddDbContextCheck<ApplicationContext>(tags: ["ready"]);

builder.Services.AddDomainHandlers();
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddValidation();
builder.Services.AddOpenApiDocumentation();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();
app.UseOpenApiDocumentation();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationContext>();
    await db.Database.MigrateAsync();
}

app.UseHttpsRedirection();

var liveness = new HealthCheckOptions
{
    Predicate = static _ => false
};

var readiness = new HealthCheckOptions
{
    Predicate = static r => r.Tags.Contains("ready")
};

app.MapHealthChecks("/healthz", liveness)
   .WithTags("Health")
   .AllowAnonymous();

app.MapHealthChecks("/healthz/live", liveness)
   .WithTags("Health")
   .AllowAnonymous();

app.MapHealthChecks("/healthz/ready", readiness)
   .WithTags("Health")
   .AllowAnonymous();

app.MapDiscoveredEndpoints();
app.MapControllers();

app.Run();