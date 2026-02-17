using System.Reflection;
using ClutterStock.Domain;

namespace Api.Extensions;

public static class WebApplicationExtensions
{
    extension(WebApplication app)
    {
        public void MapEndpointsInAssemblies(params Assembly[] assemblies)
        {
            foreach (var assembly in assemblies)
            {
                var moduleTypes = assembly.GetTypes()
                                          .Where(static t => typeof(IEndpoint).IsAssignableFrom(t) && t is
                                          {
                                              IsInterface: false,
                                              IsAbstract: false
                                          });

                foreach (var moduleType in moduleTypes)
                {
                    var route = moduleType.GetProperty(nameof(IEndpoint.Route))
                                          ?.GetValue(null) as string;

                    var handler = moduleType.GetProperty(nameof(IEndpoint.Handler))
                                            ?.GetValue(null) as Delegate;

                    if (route is null || handler is null)
                        throw new InvalidOperationException($"The endpoint {moduleType.FullName} does not properly implement IEndpoint.");

                    var method = moduleType.GetProperty("HttpMethod")?.GetValue(null) as string ?? "GET";

                    if (string.Equals(method, "POST", StringComparison.OrdinalIgnoreCase))
                        app.MapPost(route, handler);
                    else
                        app.MapGet(route, handler);
                }
            }
        }
    }
}