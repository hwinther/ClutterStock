using System.Collections.Immutable;
using System.Linq;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;

namespace EndpointGenerator;

[Generator(LanguageNames.CSharp)]
public sealed class HandlerRegistrationGenerator : IIncrementalGenerator
{
    private const string ICommandHandlerFullName = "ClutterStock.Domain.Abstractions.ICommandHandler";
    private const string IQueryHandlerFullName = "ClutterStock.Domain.Abstractions.IQueryHandler";
    private const string GeneratedNamespace = "ClutterStock.Api.Generated";
    private const string GeneratedClassName = "HandlerRegistration";

    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        context.RegisterSourceOutput(
            context.CompilationProvider,
            static (productionContext, compilation) =>
            {
                try
                {
                    var commandHandlerMarker = FindTypeByFullName(compilation, ICommandHandlerFullName);
                    var queryHandlerMarker = FindTypeByFullName(compilation, IQueryHandlerFullName);
                    if (commandHandlerMarker is null && queryHandlerMarker is null)
                        return;

                    var handlerRegistrations = GetHandlerRegistrations(compilation, commandHandlerMarker, queryHandlerMarker);
                    if (handlerRegistrations.IsEmpty)
                        return;

                    var source = GenerateHandlerRegistration(handlerRegistrations);
                    productionContext.AddSource("HandlerRegistration.g.cs", SourceText.From(source, Encoding.UTF8));
                }
                catch (System.Exception ex)
                {
                    productionContext.ReportDiagnostic(
                        Diagnostic.Create(
                            new DiagnosticDescriptor(
                                "HRGEN001",
                                "Handler registration generator",
                                "Generator failed: {0}",
                                "CodeGen",
                                DiagnosticSeverity.Warning,
                                true),
                            Location.None,
                            ex.Message));
                }
            });
    }

    private static INamedTypeSymbol? FindTypeByFullName(Compilation compilation, string fullName)
    {
        foreach (var assembly in compilation.SourceModule.ReferencedAssemblySymbols)
        {
            var type = FindTypeByFullName(assembly.GlobalNamespace, fullName);
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
                found = FindTypeByFullName(childNs, fullName);
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

    private static System.Collections.Generic.IEnumerable<INamedTypeSymbol> GetAllTypes(INamespaceOrTypeSymbol symbol)
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

    private static ImmutableArray<(INamedTypeSymbol Interface, INamedTypeSymbol Implementation)> GetHandlerRegistrations(
        Compilation compilation,
        INamedTypeSymbol? commandHandlerMarker,
        INamedTypeSymbol? queryHandlerMarker)
    {
        var comparer = SymbolEqualityComparer.Default;
        var handlerInterfaces = ImmutableArray.CreateBuilder<INamedTypeSymbol>();

        foreach (var assembly in compilation.SourceModule.ReferencedAssemblySymbols)
        {
            foreach (var type in GetAllTypes(assembly.GlobalNamespace))
            {
                if (type.TypeKind != TypeKind.Interface || type.DeclaredAccessibility != Accessibility.Public)
                    continue;
                if (type.ContainingType is not null)
                    continue;

                if (commandHandlerMarker is not null && type.Interfaces.Any(i => comparer.Equals(i.OriginalDefinition, commandHandlerMarker)))
                    handlerInterfaces.Add(type);
                else if (queryHandlerMarker is not null && type.Interfaces.Any(i => comparer.Equals(i.OriginalDefinition, queryHandlerMarker)))
                    handlerInterfaces.Add(type);
            }
        }

        var result = ImmutableArray.CreateBuilder<(INamedTypeSymbol Interface, INamedTypeSymbol Implementation)>();

        foreach (var handlerInterface in handlerInterfaces)
        {
            INamedTypeSymbol? implementation = null;

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

                    if (!type.AllInterfaces.Any(i => comparer.Equals(i.OriginalDefinition, handlerInterface)))
                        continue;

                    if (implementation is not null)
                    {
                        implementation = null;
                        break;
                    }
                    implementation = type;
                }

                if (implementation is not null)
                    break;
            }

            if (implementation is not null)
                result.Add((handlerInterface, implementation));
        }

        return [.. result.OrderBy(static x => x.Interface.ToDisplayString())];
    }

    private static string GenerateHandlerRegistration(
        ImmutableArray<(INamedTypeSymbol Interface, INamedTypeSymbol Implementation)> registrations)
    {
        var sb = new StringBuilder();
        sb.AppendLine("// <auto-generated/>");
        sb.AppendLine("#nullable enable");
        sb.AppendLine("using Microsoft.Extensions.DependencyInjection;");
        sb.AppendLine();
        sb.AppendLine("namespace ").Append(GeneratedNamespace).AppendLine(";");
        sb.AppendLine();
        sb.AppendLine("public static partial class ").Append(GeneratedClassName).AppendLine();
        sb.AppendLine("{");
        sb.AppendLine("    public static IServiceCollection AddDomainHandlers(this IServiceCollection services)");
        sb.AppendLine("    {");
        foreach (var (handlerInterface, implementation) in registrations)
        {
            var ifaceName = handlerInterface.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat).Replace("global::", "");
            var implName = implementation.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat).Replace("global::", "");
            sb.Append("        services.AddScoped<").Append(ifaceName).Append(", ").Append(implName).AppendLine(">();");
        }
        sb.AppendLine("        return services;");
        sb.AppendLine("    }");
        sb.AppendLine("}");
        sb.AppendLine();

        return sb.ToString();
    }
}
