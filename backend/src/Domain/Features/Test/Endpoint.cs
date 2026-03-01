using ClutterStock.Domain.Abstractions;
using Microsoft.AspNetCore.Builder;

namespace ClutterStock.Domain.Features.Test;

[HttpMethod(HttpVerb.Get)]
public class Endpoint : IEndpoint
{
    public static string Route => "/test";

    public static Delegate Handler { get; } = static () => "Hello World!";

    public static RouteHandlerBuilder Map(WebApplication app) => app.MapGet(Route, Handler);
}