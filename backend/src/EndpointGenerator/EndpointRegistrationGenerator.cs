using System.Collections.Immutable;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;

namespace EndpointGenerator;

[Generator(LanguageNames.CSharp)]
public sealed class EndpointRegistrationGenerator : IIncrementalGenerator
{
    private const string IEndpointFullName = "ClutterStock.Domain.Abstractions.IEndpoint";
    private const string HttpMethodAttributeFullName = "ClutterStock.Domain.Abstractions.HttpMethodAttribute";
    private const string OpenApiDescriptionAttributeFullName = "ClutterStock.Domain.Abstractions.OpenApiDescriptionAttribute";
    private const string GeneratedNamespace = "ClutterStock.Api.Generated";
    private const string GeneratedClassName = "EndpointRegistration";

    private const string FeaturesNamespacePrefix = "ClutterStock.Domain.Features.";

    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        context.RegisterSourceOutput(
            context.CompilationProvider,
            static (productionContext, compilation) =>
            {
                try
                {
                    var endpointInterface = FindIEndpoint(compilation);
                    if (endpointInterface is null)
                        return;

                    var httpMethodAttribute = FindHttpMethodAttribute(compilation);
                    var openApiDescriptionAttribute = FindOpenApiDescriptionAttribute(compilation);
                    var endpointTypes = GetEndpointTypes(compilation, endpointInterface);
                    if (endpointTypes.IsEmpty)
                        return;

                    var source = GenerateEndpointRegistration(endpointTypes, httpMethodAttribute, openApiDescriptionAttribute);
                    productionContext.AddSource("EndpointRegistration.g.cs", SourceText.From(source, Encoding.UTF8));
                }
                catch (Exception ex)
                {
                    productionContext.ReportDiagnostic(
                        Diagnostic.Create(
                            new DiagnosticDescriptor(
                                "EPGEN001",
                                "Endpoint registration generator",
                                "Generator failed: {0}",
                                "CodeGen",
                                DiagnosticSeverity.Warning,
                                true),
                            Location.None,
                            ex.Message));
                }
            });
    }

    private static INamedTypeSymbol? FindIEndpoint(Compilation compilation)
    {
        foreach (var assembly in compilation.SourceModule.ReferencedAssemblySymbols)
        {
            var type = FindTypeByFullName(assembly.GlobalNamespace, IEndpointFullName);
            if (type is not null)
                return type;
        }

        return null;
    }

    private static INamedTypeSymbol? FindTypeByFullName(INamespaceOrTypeSymbol symbol, string fullName)
    {
        if (symbol is INamedTypeSymbol type && type.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat) == "global::" + fullName)
            return type;

        foreach (var member in symbol.GetMembers())
        {
            INamedTypeSymbol? found = null;
            if (member is INamespaceSymbol childNs)
            {
                found = FindTypeByFullName(childNs, fullName);
            }
            else if (member is INamedTypeSymbol childType)
            {
                if (childType.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat) == "global::" + fullName)
                    return childType;

                foreach (var nested in childType.GetTypeMembers())
                {
                    found = FindTypeByFullName(nested, fullName);
                    if (found is not null) break;
                }
            }

            if (found is not null)
                return found;
        }

        return null;
    }

    private static INamedTypeSymbol? FindHttpMethodAttribute(Compilation compilation)
    {
        foreach (var assembly in compilation.SourceModule.ReferencedAssemblySymbols)
        {
            var type = FindTypeByFullName(assembly.GlobalNamespace, HttpMethodAttributeFullName);
            if (type is not null)
                return type;
        }

        return null;
    }

    private static INamedTypeSymbol? FindOpenApiDescriptionAttribute(Compilation compilation)
    {
        foreach (var assembly in compilation.SourceModule.ReferencedAssemblySymbols)
        {
            var type = FindTypeByFullName(assembly.GlobalNamespace, OpenApiDescriptionAttributeFullName);
            if (type is not null)
                return type;
        }

        return null;
    }

    private static ImmutableArray<INamedTypeSymbol> GetEndpointTypes(Compilation compilation, INamedTypeSymbol endpointInterface)
    {
        var comparer = SymbolEqualityComparer.Default;
        var builder = ImmutableArray.CreateBuilder<INamedTypeSymbol>();

        foreach (var assembly in compilation.SourceModule.ReferencedAssemblySymbols)
        {
            foreach (var type in GetAllTypes(assembly.GlobalNamespace))
            {
                if (type.TypeKind != TypeKind.Class || type.DeclaredAccessibility != Accessibility.Public)
                    continue;

                if (type.IsAbstract)
                    continue;

                if (type.ContainingType is not null)
                    continue;

                if (!type.AllInterfaces.Any(i => comparer.Equals(i.OriginalDefinition, endpointInterface)))
                    continue;

                if (type.GetMembers("Route")
                        .FirstOrDefault() is not IPropertySymbol routeProp || !routeProp.IsStatic)
                    continue;

                if (type.GetMembers("Handler")
                        .FirstOrDefault() is not IPropertySymbol handlerProp || !handlerProp.IsStatic)
                    continue;

                builder.Add(type);
            }
        }

        return [.. builder.OrderBy(static t => t.ToDisplayString())];
    }

    private static IEnumerable<INamedTypeSymbol> GetAllTypes(INamespaceOrTypeSymbol symbol)
    {
        if (symbol is INamedTypeSymbol type)
            yield return type;

        foreach (var member in symbol.GetMembers())
        {
            if (member is INamespaceSymbol childNs)
            {
                foreach (var t in GetAllTypes(childNs))
                    yield return t;
            }
            else if (member is INamedTypeSymbol childType)
            {
                yield return childType;
                foreach (var nested in childType.GetTypeMembers())
                {
                    foreach (var t in GetAllTypes(nested))
                        yield return t;
                }
            }
        }
    }

    private static string GetOpenApiTagForEndpoint(INamedTypeSymbol endpointType)
    {
        var ns = endpointType.ContainingNamespace?.ToDisplayString() ?? "";
        if (!ns.StartsWith(FeaturesNamespacePrefix, StringComparison.Ordinal))
            return "Api";

        var afterFeatures = ns.Substring(FeaturesNamespacePrefix.Length);
        var dot = afterFeatures.IndexOf('.');
        return dot >= 0 ? afterFeatures.Substring(0, dot) : afterFeatures;
    }

    private static string? GetEndpointDescription(INamedTypeSymbol endpointType, INamedTypeSymbol? openApiDescriptionAttributeType)
    {
        if (openApiDescriptionAttributeType is null)
            return null;

        var attr = endpointType.GetAttributes()
                               .FirstOrDefault(a =>
                                                   SymbolEqualityComparer.Default.Equals(a.AttributeClass?.OriginalDefinition, openApiDescriptionAttributeType));

        if (attr is null || attr.ConstructorArguments.IsEmpty)
            return null;

        var arg = attr.ConstructorArguments[0];
        if (arg.Kind != TypedConstantKind.Primitive || arg.Value is not string s)
            return null;

        return s;
    }

    private static string EscapeForCSharpStringLiteral(string value) =>
        value.Replace("\\", "\\\\")
             .Replace("\"", "\\\"")
             .Replace("\r", "\\r")
             .Replace("\n", "\\n");

    private static string GetMapMethodName(INamedTypeSymbol endpointType, INamedTypeSymbol? httpMethodAttributeType)
    {
        if (httpMethodAttributeType is null)
            return "MapGet";

        var attr = endpointType.GetAttributes()
                               .FirstOrDefault(a =>
                                                   SymbolEqualityComparer.Default.Equals(a.AttributeClass?.OriginalDefinition, httpMethodAttributeType));

        if (attr?.ConstructorArguments.IsEmpty != false)
            return "MapGet";

        var arg = attr.ConstructorArguments[0];
        if (arg.Kind != TypedConstantKind.Enum || arg.Value is not int enumValue)
            return "MapGet";

        return enumValue switch
        {
            0 => "MapGet", // HttpVerb.Get
            1 => "MapPost", // HttpVerb.Post
            2 => "MapPut", // HttpVerb.Put
            3 => "MapPatch", // HttpVerb.Patch
            4 => "MapDelete", // HttpVerb.Delete
            _ => "MapGet"
        };
    }

    private static string GenerateEndpointRegistration(ImmutableArray<INamedTypeSymbol> endpointTypes, INamedTypeSymbol? httpMethodAttributeType, INamedTypeSymbol? openApiDescriptionAttributeType)
    {
        var sb = new StringBuilder();
        sb.AppendLine("// <auto-generated/>");
        sb.AppendLine("#nullable enable");
        sb.AppendLine("using Microsoft.AspNetCore.Builder;");
        sb.AppendLine();
        sb.Append("namespace ")
          .Append(GeneratedNamespace)
          .AppendLine(";");

        sb.AppendLine();
        sb.AppendLine("/// Generated endpoints mapper");
        sb.Append("public static partial class ")
          .Append(GeneratedClassName)
          .AppendLine();

        sb.AppendLine("{");
        sb.AppendLine("    /// Generated endpoints mapper");
        sb.AppendLine("    public static void MapDiscoveredEndpoints(this WebApplication app)");
        sb.AppendLine("    {");
        foreach (var type in endpointTypes)
        {
            var fullName = type.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat)
                               .Replace("global::", "");

            var route = fullName + ".Route";
            var handler = fullName + ".Handler";
            var mapMethod = GetMapMethodName(type, httpMethodAttributeType);
            var tag = GetOpenApiTagForEndpoint(type);
            var description = GetEndpointDescription(type, openApiDescriptionAttributeType);
            sb.Append("        app.")
              .Append(mapMethod)
              .Append("(")
              .Append(route)
              .Append(", ")
              .Append(handler)
              .Append(").WithTags(\"")
              .Append(tag)
              .Append("\")");

            if (description is not null)
                sb.Append(".WithDescription(\"")
                  .Append(EscapeForCSharpStringLiteral(description))
                  .Append("\")");

            sb.AppendLine(";");
        }

        sb.AppendLine("    }");
        sb.AppendLine("}");
        sb.AppendLine();

        return sb.ToString();
    }
}