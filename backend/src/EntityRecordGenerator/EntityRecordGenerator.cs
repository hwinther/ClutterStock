using System;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
using System.Xml;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
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

                if (type.IsAbstract)
                    continue;

                if (type.ContainingNamespace?.ToDisplayString() != EntitiesNamespace)
                    continue;

                // Skip if it's a nested type
                if (type.ContainingType != null)
                    continue;

                results.Add(type);
            }
        }

        return [.. results.OrderBy(static t => t.Name)];
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

    /// <summary>Gets all data properties from the type and its base types, excluding navigation properties.</summary>
    private static IEnumerable<IPropertySymbol> GetDataProperties(
        INamedTypeSymbol type,
        ImmutableArray<INamedTypeSymbol> entityTypes,
        SymbolEqualityComparer comparer)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var current = type;
        while (current != null)
        {
            foreach (var member in current.GetMembers())
            {
                if (member is not IPropertySymbol prop ||
                    prop.DeclaredAccessibility != Accessibility.Public ||
                    prop.IsStatic ||
                    prop.GetMethod == null ||
                    IsNavigationProperty(prop, entityTypes, comparer) ||
                    !seen.Add(prop.Name))
                    continue;

                yield return prop;
            }
            current = current.BaseType;
        }
    }

    /// <summary>Returns true if the type is non-nullable and should get the required modifier.</summary>
    private static bool IsRequired(ITypeSymbol type)
    {
        if (type is INamedTypeSymbol named && named.OriginalDefinition.SpecialType == SpecialType.System_Nullable_T)
            return false;
        if (type.NullableAnnotation == NullableAnnotation.Annotated)
            return false;
        return true;
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
        if (type is IArrayTypeSymbol arr && arr.ElementType.SpecialType == SpecialType.System_Byte)
            return "System.Array.Empty<byte>()";
        if (type.IsReferenceType || type.NullableAnnotation == NullableAnnotation.Annotated)
            return "null";
        return "default";
    }

    /// <summary>Returns example value as text for XML doc &lt;example&gt; (human-readable, XML-safe).</summary>
    private static string GetExampleForXmlDoc(ITypeSymbol type)
    {
        if (type is INamedTypeSymbol named && named.OriginalDefinition.SpecialType == SpecialType.System_Nullable_T)
            return "null";
        switch (type.SpecialType)
        {
            case SpecialType.System_String:
                return "";
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
            case SpecialType.System_DateTime:
                return "default";
        }
        if (type.IsReferenceType || type.NullableAnnotation == NullableAnnotation.Annotated)
            return "null";
        return "default";
    }

    /// <summary>Tries to get the default value expression from the entity property's initializer (e.g. = string.Empty, = 0, = []). Returns null when not available (e.g. from metadata).</summary>
    private static string? TryGetDefaultValueFromEntityProperty(IPropertySymbol property)
    {
        if (property.DeclaringSyntaxReferences.Length == 0)
            return null;
        var syntax = property.DeclaringSyntaxReferences[0].GetSyntax();
        if (syntax is not PropertyDeclarationSyntax propDecl || propDecl.Initializer == null)
            return null;
        var valueText = propDecl.Initializer.Value.ToFullString().Trim();
        return string.IsNullOrEmpty(valueText) ? null : SanitizeForSource(valueText);
    }

    /// <summary>Tries to get the &lt;example&gt; value from the entity property's XML doc when available (e.g. from source).</summary>
    private static string? TryGetExampleFromEntityProperty(IPropertySymbol property, Compilation compilation)
    {
        var xml = property.GetDocumentationCommentXml(expandIncludes: true, cancellationToken: default);
        if (string.IsNullOrWhiteSpace(xml))
            return null;
        try
        {
            var doc = new XmlDocument();
            doc.LoadXml("<root>" + xml + "</root>");
            var example = doc.SelectSingleNode("//example");
            return example?.InnerText?.Trim();
        }
        catch
        {
            return null;
        }
    }

    private static string EscapeForXmlDoc(string value)
    {
        if (string.IsNullOrEmpty(value))
            return value;
        return value
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;");
    }

    /// <summary>Handles special placeholders like generate(int), generate(guid), generate(utcnow). Returns null if not a special value.</summary>
    private static string? TryGetSpecialValueExpression(string trimmed, ITypeSymbol type)
    {
        if (!trimmed.StartsWith("generate(", StringComparison.OrdinalIgnoreCase))
            return null;
        var inner = trimmed.Substring(9).Trim().TrimEnd(')').Trim();
        if (string.IsNullOrEmpty(inner))
            return null;
        if (inner.Equals("int", StringComparison.OrdinalIgnoreCase) || inner.Equals("Int32", StringComparison.OrdinalIgnoreCase))
            return "System.Random.Shared.Next()";
        if (inner.Equals("long", StringComparison.OrdinalIgnoreCase) || inner.Equals("Int64", StringComparison.OrdinalIgnoreCase))
            return "System.Random.Shared.NextInt64()";
        if (inner.Equals("guid", StringComparison.OrdinalIgnoreCase) || inner.Equals("Guid", StringComparison.OrdinalIgnoreCase))
            return "System.Guid.NewGuid()";
        if (inner.Equals("datetime", StringComparison.OrdinalIgnoreCase) || inner.Equals("DateTime", StringComparison.OrdinalIgnoreCase) || inner.Equals("utcnow", StringComparison.OrdinalIgnoreCase))
            return "System.DateTime.UtcNow";
        if (inner.Equals("datetimeoffset", StringComparison.OrdinalIgnoreCase) || inner.Equals("DateTimeOffset", StringComparison.OrdinalIgnoreCase) || inner.Equals("utcoffset", StringComparison.OrdinalIgnoreCase))
            return "System.DateTimeOffset.UtcNow";
        if (inner.Equals("bytes", StringComparison.OrdinalIgnoreCase) || inner.Equals("byte[]", StringComparison.OrdinalIgnoreCase))
            return "System.Array.ConvertAll(new byte[8], _ => (byte)System.Random.Shared.Next(256))";
        if (inner.StartsWith("byte[", StringComparison.OrdinalIgnoreCase) && inner.EndsWith("]"))
        {
            var lenStr = inner.Substring(5, inner.Length - 6).Trim();
            if (int.TryParse(lenStr, out var len) && len > 0 && len <= 1024)
                return "System.Array.ConvertAll(new byte[" + len + "], _ => (byte)System.Random.Shared.Next(256))";
        }
        if (inner.StartsWith("bytes[", StringComparison.OrdinalIgnoreCase) && inner.EndsWith("]"))
        {
            var lenStr = inner.Substring(6, inner.Length - 7).Trim();
            if (int.TryParse(lenStr, out var len) && len > 0 && len <= 1024)
                return "System.Array.ConvertAll(new byte[" + len + "], _ => (byte)System.Random.Shared.Next(256))";
        }
        return null;
    }

    /// <summary>Returns a C# expression for the given example text and property type; falls back to default when example is null/empty or unparseable.</summary>
    private static string GetExampleValueExpression(string? exampleText, ITypeSymbol type)
    {
        if (string.IsNullOrWhiteSpace(exampleText))
            return GetDefaultValueExpression(type);
        var trimmed = exampleText!.Trim();
        if (trimmed.Equals("null", StringComparison.OrdinalIgnoreCase))
            return "null";
        var special = TryGetSpecialValueExpression(trimmed, type);
        if (special != null)
            return special;
        if (type is INamedTypeSymbol named && named.OriginalDefinition.SpecialType == SpecialType.System_Nullable_T)
            return "null";
        var typeDisplay = type.ToDisplayString();
        if (typeDisplay.IndexOf("DateTimeOffset", StringComparison.Ordinal) >= 0 && trimmed.IndexOf("generate(", StringComparison.OrdinalIgnoreCase) >= 0 && trimmed.IndexOf("DateTimeOffset", StringComparison.OrdinalIgnoreCase) >= 0)
            return "System.DateTimeOffset.UtcNow";
        switch (type.SpecialType)
        {
            case SpecialType.System_String:
                return "\"" + EscapeCSharpString(trimmed) + "\"";
            case SpecialType.System_Boolean:
                if (trimmed.Equals("true", StringComparison.OrdinalIgnoreCase)) return "true";
                if (trimmed.Equals("false", StringComparison.OrdinalIgnoreCase)) return "false";
                return GetDefaultValueExpression(type);
            case SpecialType.System_Int32:
                return int.TryParse(trimmed, out var i32) ? i32.ToString() : GetDefaultValueExpression(type);
            case SpecialType.System_Int64:
                return long.TryParse(trimmed, out var i64) ? i64.ToString() + "L" : GetDefaultValueExpression(type);
            case SpecialType.System_Int16:
                return short.TryParse(trimmed, out var i16) ? i16.ToString() : GetDefaultValueExpression(type);
            case SpecialType.System_UInt32:
                return uint.TryParse(trimmed, out var u32) ? u32.ToString() + "u" : GetDefaultValueExpression(type);
            case SpecialType.System_UInt64:
                return ulong.TryParse(trimmed, out var u64) ? u64.ToString() + "UL" : GetDefaultValueExpression(type);
            case SpecialType.System_Byte:
                return byte.TryParse(trimmed, out var b) ? b.ToString() : GetDefaultValueExpression(type);
            case SpecialType.System_SByte:
                return sbyte.TryParse(trimmed, out var sb) ? sb.ToString() : GetDefaultValueExpression(type);
            case SpecialType.System_Decimal:
                return decimal.TryParse(trimmed, out var dec) ? dec.ToString() + "m" : GetDefaultValueExpression(type);
            case SpecialType.System_Single:
                return float.TryParse(trimmed, out var f) ? f.ToString() + "f" : GetDefaultValueExpression(type);
            case SpecialType.System_Double:
                return double.TryParse(trimmed, out var d) ? d.ToString() + "d" : GetDefaultValueExpression(type);
            case SpecialType.System_DateTime:
                if (DateTime.TryParse(trimmed, out _))
                    return "System.DateTime.Parse(\"" + EscapeCSharpString(trimmed) + "\")";
                return GetDefaultValueExpression(type);
        }
        if (type.ToDisplayString().IndexOf("DateTimeOffset", StringComparison.Ordinal) >= 0 && DateTimeOffset.TryParse(trimmed, out _))
            return "System.DateTimeOffset.Parse(\"" + EscapeCSharpString(trimmed) + "\")";
        if (type is IArrayTypeSymbol arr && arr.ElementType.SpecialType == SpecialType.System_Byte)
        {
            var parts = trimmed.Split(',');
            var bytes = new List<byte>();
            foreach (var part in parts)
            {
                if (byte.TryParse(part.Trim(), out var b))
                    bytes.Add(b);
            }
            if (bytes.Count > 0)
                return "new byte[] { " + string.Join(", ", bytes) + " }";
            return GetDefaultValueExpression(type);
        }
        if (type.IsReferenceType || type.NullableAnnotation == NullableAnnotation.Annotated)
            return "\"" + EscapeCSharpString(trimmed) + "\"";
        return GetDefaultValueExpression(type);
    }

    private static string EscapeCSharpString(string value)
    {
        if (string.IsNullOrEmpty(value))
            return value;
        return value
            .Replace("\\", "\\\\")
            .Replace("\"", "\\\"")
            .Replace("\0", "\\0")
            .Replace("\n", "\\n")
            .Replace("\r", "\\r")
            .Replace("\t", "\\t");
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
            var dataProps = GetDataProperties(type, entityTypes, comparer)
                .OrderBy(static p => p.Name switch { "Id" => 0, "RowVersion" => 1, _ => 2 })
                .ToList();

            if (dataProps.Count == 0)
                continue;

            var recordName = GetRecordTypeName(type);
            var crefType = SanitizeForSource("global::" + type.ToDisplayString());
            sb.Append("/// <summary>Seed/mock data record with same data shape as entity <see cref=\"")
              .Append(crefType)
              .AppendLine("\"/>.</summary>");

            sb.Append("public record ").Append(recordName).AppendLine("()");
            sb.AppendLine("{");
            foreach (var p in dataProps)
            {
                var exampleText = TryGetExampleFromEntityProperty(p, compilation);
                if (exampleText != null && !string.IsNullOrEmpty(exampleText))
                    sb.Append("    /// <example>").Append(EscapeForXmlDoc(exampleText)).AppendLine("</example>");
                var typeStr = ToRecordTypeDisplay(p.Type);
                var defaultFromEntity = TryGetDefaultValueFromEntityProperty(p);
                if (IsRequired(p.Type) && defaultFromEntity == null)
                    sb.Append("    public required ");
                else
                    sb.Append("    public ");
                sb.Append(typeStr).Append(" ").Append(p.Name).Append(" { get; init; }");
                if (defaultFromEntity != null)
                    sb.Append(" = ").Append(defaultFromEntity).Append(";");
                sb.AppendLine();
            }
            sb.AppendLine();
            sb.AppendLine("    /// <summary>Creates an instance with initial values matching the &lt;example&gt; values in the property XML docs.</summary>");
            sb.Append("    public static ").Append(recordName).Append(" CreateWithExampleValues() => new ").Append(recordName).AppendLine();
            sb.AppendLine("    {");
            foreach (var p in dataProps)
            {
                var exampleForInit = TryGetExampleFromEntityProperty(p, compilation);
                var defaultFromEntity = TryGetDefaultValueFromEntityProperty(p);
                var initValue = exampleForInit != null && exampleForInit.Length > 0
                    ? GetExampleValueExpression(exampleForInit, p.Type)
                    : (defaultFromEntity ?? GetDefaultValueExpression(p.Type));
                sb.Append("        ").Append(p.Name).Append(" = ").Append(initValue).AppendLine(",");
            }
            sb.AppendLine("    };");
            sb.AppendLine();
            var entityFullName = SanitizeForSource("global::" + type.ToDisplayString());
            sb.AppendLine("    /// <summary>Converts this seed record to an entity instance for saving to the database.</summary>");
            sb.AppendLine("    [return: System.Diagnostics.CodeAnalysis.NotNullIfNotNull(nameof(self))]");
            sb.Append("    public static implicit operator ").Append(entityFullName).Append("?(").Append(recordName).AppendLine("? self)");
            sb.AppendLine("    {");
            sb.AppendLine("        if (self is null) return null;");
            sb.Append("        return new ").Append(entityFullName).AppendLine();
            sb.AppendLine("        {");
            foreach (var p in dataProps)
            {
                sb.Append("            ").Append(p.Name).Append(" = self.").Append(p.Name).AppendLine(",");
            }
            sb.AppendLine("        };");
            sb.AppendLine("    }");
            sb.AppendLine();
            sb.AppendLine("    /// <summary>Converts an entity from the database to its seed record twin.</summary>");
            sb.AppendLine("    [return: System.Diagnostics.CodeAnalysis.NotNullIfNotNull(nameof(entity))]");
            sb.Append("    public static implicit operator ").Append(recordName).Append("?(").Append(entityFullName).AppendLine("? entity)");
            sb.AppendLine("    {");
            sb.AppendLine("        if (entity is null) return null;");
            sb.Append("        return new ").Append(recordName).AppendLine();
            sb.AppendLine("        {");
            foreach (var p in dataProps)
            {
                sb.Append("            ").Append(p.Name).Append(" = entity.").Append(p.Name).AppendLine(",");
            }
            sb.AppendLine("        };");
            sb.AppendLine("    }");
            sb.AppendLine("}");
            sb.AppendLine();
        }

        return sb.ToString();
    }
}