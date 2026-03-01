using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Builder;

namespace ClutterStock.Domain.Features.Test;

public class Endpoint : IEndpoint
{
    /// <inheritdoc />
    public static string Route => "/test";

    /// <inheritdoc />
    public static Delegate Handler { get; } = static () => "Hello World!";

    public static RouteHandlerBuilder Map(WebApplication app) => app.MapGet(Route, Handler);
}