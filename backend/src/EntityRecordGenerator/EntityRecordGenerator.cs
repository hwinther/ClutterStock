using System;
using System.Collections.Immutable;
using System.Text;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;

namespace EntityRecordGenerator;

[Generator(LanguageNames.CSharp)]
public sealed class EntityRecordGenerator : IIncrementalGenerator
{
    private const string EntitiesNamespace = "ClutterStock.Entities";
    private const string SeedDataNamespace = "ClutterStock.Entities.SeedData";

    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        context.RegisterSourceOutput(
            context.CompilationProvider,
            static (productionContext, compilation) =>
            {
                try
                {
                    var entityTypes = GetEntityTypes(compilation);
                    if (!entityTypes.Any())
                        return;

                    var source = GenerateSeedDataRecords(compilation, entityTypes);
                    productionContext.AddSource("EntitySeedData.g.cs", SourceText.From(source, Encoding.UTF8));
                }
                catch (Exception ex)
                {
                    productionContext.ReportDiagnostic(
                        Diagnostic.Create(
                            new DiagnosticDescriptor(
                                "CSG001",
                                "Entity record generator",
                                "Generator failed: {0}",
                                "CodeGen",
                                DiagnosticSeverity.Warning,
                                true),
                            Location.None,
                            ex.Message));
                }
            });
    }

    private static ImmutableArray<INamedTypeSymbol> GetEntityTypes(Compilation compilation)
    {
        var results = ImmutableArray.CreateBuilder<INamedTypeSymbol>();
        var comparer = SymbolEqualityComparer.Default;

        foreach (var assembly in compilation.SourceModule.ReferencedAssemblySymbols)
        {
            foreach (var type in GetAllTypes(assembly.GlobalNamespace))
            {
                if (type.TypeKind != TypeKind.Class || type.DeclaredAccessibility != Accessibility.Public)
                    continue;

                if (type.ContainingNamespace?.ToDisplayString() != EntitiesNamespace)
                    continue;

                // Skip if it's a nested type
                if (type.ContainingType != null)
                    continue;

                results.Add(type);
            }
        }

        return [..results.OrderBy(static t => t.Name)];
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

    private static bool IsNavigationProperty(IPropertySymbol prop, ImmutableArray<INamedTypeSymbol> entityTypes, SymbolEqualityComparer comparer)
    {
        var type = prop.Type;
        if (type is INamedTypeSymbol named)
        {
            if (entityTypes.Any(e => comparer.Equals(e, type)))
                return true;

            if (named.OriginalDefinition?.ToDisplayString() == "System.Collections.Generic.ICollection<T>")
                if (named.TypeArguments.Length == 1 && entityTypes.Any(e => comparer.Equals(e, named.TypeArguments[0])))
                    return true;
        }

        return false;
    }

    private static string GetRecordTypeName(INamedTypeSymbol type) => type.Name;

    private static string ToRecordTypeDisplay(ITypeSymbol type)
    {
        var display = type.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat);
        var result = SanitizeForSource(display.Replace("global::", ""));
        // Include nullable reference type annotation (e.g. string? ) so generated records match entity shape
        if (type.NullableAnnotation == NullableAnnotation.Annotated && !result.EndsWith("?", StringComparison.Ordinal))
            result += "?";
        return result;
    }

    /// <summary>Removes newlines and other characters that break generated source or XML doc comments.</summary>
    private static string SanitizeForSource(string value)
    {
        if (string.IsNullOrEmpty(value))
            return value;
        return value
            .Replace("\r", "")
            .Replace("\n", " ")
            .Replace("  ", " ");
    }

    /// <summary>Returns a C# default value expression for the type (for parameterless constructor).</summary>
    private static string GetDefaultValueExpression(ITypeSymbol type)
    {
        if (type is INamedTypeSymbol named && named.OriginalDefinition.SpecialType == SpecialType.System_Nullable_T)
            return "null";
        switch (type.SpecialType)
        {
            case SpecialType.System_String:
                return "string.Empty";
            case SpecialType.System_Int32:
            case SpecialType.System_Int64:
            case SpecialType.System_Int16:
            case SpecialType.System_UInt32:
            case SpecialType.System_UInt64:
            case SpecialType.System_UInt16:
            case SpecialType.System_Byte:
            case SpecialType.System_SByte:
                return "0";
            case SpecialType.System_Boolean:
                return "false";
            case SpecialType.System_Decimal:
            case SpecialType.System_Single:
            case SpecialType.System_Double:
                return "0";
        }
        if (type.IsReferenceType || type.NullableAnnotation == NullableAnnotation.Annotated)
            return "null";
        return "default";
    }

    private static string GenerateSeedDataRecords(Compilation compilation, ImmutableArray<INamedTypeSymbol> entityTypes)
    {
        var sb = new StringBuilder();
        var comparer = SymbolEqualityComparer.Default;

        sb.AppendLine("// <auto-generated />");
        sb.AppendLine("#nullable enable");
        sb.AppendLine();
        sb.AppendLine($"namespace {SeedDataNamespace};");
        sb.AppendLine();

        foreach (var type in entityTypes)
        {
            var dataProps = type.GetMembers()
                                .OfType<IPropertySymbol>()
                                .Where(static p => p.DeclaredAccessibility == Accessibility.Public && !p.IsStatic && p.GetMethod != null)
                                .Where(p => !IsNavigationProperty(p, entityTypes, comparer))
                                .OrderBy(static p => p.Name == "Id" ? 0 : 1)
                                .ToList();

            if (dataProps.Count == 0)
                continue;

            var recordName = GetRecordTypeName(type);
            var crefType = SanitizeForSource("global::" + type.ToDisplayString());
            sb.Append("/// <summary>Seed/mock data record with same data shape as entity <see cref=\"")
              .Append(crefType)
              .AppendLine("\"/>.</summary>");

            sb.Append("public record ")
              .Append(recordName)
              .Append("(");

            sb.AppendLine();
            for (var i = 0; i < dataProps.Count; i++)
            {
                var p = dataProps[i];
                var typeStr = ToRecordTypeDisplay(p.Type);
                sb.Append("    ")
                  .Append(typeStr)
                  .Append(" ")
                  .Append(p.Name);

                if (i < dataProps.Count - 1)
                    sb.Append(",");

                sb.AppendLine();
            }

            sb.AppendLine(")");
            sb.AppendLine("{");
            // Parameterless constructor for object-initializer style: new Item { Id = 1, Name = "Box" }
            sb.Append("    public ").Append(recordName).Append("() : this(");
            for (var i = 0; i < dataProps.Count; i++)
            {
                if (i > 0)
                    sb.Append(", ");
                sb.Append(GetDefaultValueExpression(dataProps[i].Type));
            }
            sb.AppendLine(") { }");
            sb.AppendLine();
            sb.AppendLine("    /// <summary>Converts this seed record to an entity instance for saving to the database.</summary>");
            var entityFullName = SanitizeForSource("global::" + type.ToDisplayString());
            sb.Append("    public static implicit operator ").Append(entityFullName).Append("(").Append(recordName).AppendLine("? self)");
            sb.AppendLine("    {");
            sb.AppendLine("        if (self is null) return null!;");
            sb.Append("        return new ").Append(entityFullName).AppendLine();
            sb.AppendLine("        {");
            foreach (var p in dataProps)
            {
                sb.Append("            ").Append(p.Name).Append(" = self.").Append(p.Name).AppendLine(",");
            }
            sb.AppendLine("        };");
            sb.AppendLine("    }");
            sb.AppendLine("}");
            sb.AppendLine();
        }

        return sb.ToString();
    }
}