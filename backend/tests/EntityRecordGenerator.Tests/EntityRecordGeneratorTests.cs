using System.Collections.Immutable;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace EntityRecordGenerator.Tests;

public class EntityRecordGeneratorTests
{
    [Fact]
    public void Generates_records_for_entity_types_in_referenced_assembly()
    {
        var (generated, diagnostics) = RunGeneratorWithEntityReferences(TestContext.Current.CancellationToken);

        Assert.Empty(diagnostics);
        Assert.Contains("namespace ClutterStock.Entities.SeedData;", generated);
        Assert.Contains("#nullable enable", generated);

        // All three entities become records (navigation properties excluded)
        Assert.Contains("public record Item(", generated);
        Assert.Contains("public record Location(", generated);
        Assert.Contains("public record Room(", generated);

        // Item: data props only (no Room navigation)
        Assert.Contains("int Id", generated);
        Assert.Contains("int RoomId", generated);
        Assert.Contains("string Name", generated);
        Assert.Contains("string? Description", generated);
        Assert.Contains("string? Category", generated);
        Assert.Contains("string? Notes", generated);
        Assert.Contains("DateTime CreatedAtUtc", generated);
        Assert.Contains("DateTime UpdatedAtUtc", generated);

        // No navigation property types in record parameters
        Assert.DoesNotContain("Room Room", generated);
        Assert.DoesNotContain("Location Location", generated);
        Assert.DoesNotContain("ICollection<", generated);
    }

    [Fact]
    public void Generates_nothing_when_no_entities_assembly_referenced()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var compilation = CSharpCompilation.Create(
            "Empty",
            [CSharpSyntaxTree.ParseText("// placeholder", cancellationToken: cancellationToken)],
            [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);

        GeneratorDriver driver = CSharpGeneratorDriver.Create(new EntityRecordGenerator());
        driver = driver.RunGenerators(compilation, cancellationToken);
        var result = driver.GetRunResult();

        var generated = result.GeneratedTrees.Length > 0
            ? result.GeneratedTrees[0]
                    .GetText(cancellationToken)
                    .ToString()
            : "";

        Assert.Empty(result.Diagnostics);
        Assert.True(result.GeneratedTrees.Length <= 1);
        if (result.GeneratedTrees.Length == 1)
            Assert.DoesNotContain("public record ", generated);
    }

    private static (string Generated, ImmutableArray<Diagnostic> Diagnostics) RunGeneratorWithEntityReferences(CancellationToken cancellationToken = default)
    {
        var entitySources = new[]
        {
            """
            #nullable enable
            namespace ClutterStock.Entities;

            public class Location
            {
                public int Id { get; set; }
                public string Name { get; set; } = string.Empty;
                public string? Description { get; set; }
                public System.DateTime CreatedAtUtc { get; set; }
                public System.DateTime UpdatedAtUtc { get; set; }
                public System.Collections.Generic.ICollection<Room> Rooms { get; set; } = new System.Collections.Generic.List<Room>();
            }
            """,
            """
            #nullable enable
            namespace ClutterStock.Entities;

            public class Room
            {
                public int Id { get; set; }
                public int LocationId { get; set; }
                public string Name { get; set; } = string.Empty;
                public string? Description { get; set; }
                public System.DateTime CreatedAtUtc { get; set; }
                public System.DateTime UpdatedAtUtc { get; set; }
                public Location Location { get; set; } = null!;
                public System.Collections.Generic.ICollection<Item> Items { get; set; } = new System.Collections.Generic.List<Item>();
            }
            """,
            """
            #nullable enable
            namespace ClutterStock.Entities;

            public class Item
            {
                public int Id { get; set; }
                public int RoomId { get; set; }
                public string Name { get; set; } = string.Empty;
                public string? Description { get; set; }
                public string? Category { get; set; }
                public string? Notes { get; set; }
                public System.DateTime CreatedAtUtc { get; set; }
                public System.DateTime UpdatedAtUtc { get; set; }
                public Room Room { get; set; } = null!;
            }
            """
        };

        // Use references from the current runtime so BCL types (DateTime, etc.) resolve
        var refs = GetMetadataReferences();

        var entityTrees = entitySources.Select(static s => CSharpSyntaxTree.ParseText(s))
                                       .ToArray();

        var entitiesCompilation = CSharpCompilation.Create(
            "Entities",
            entityTrees,
            refs,
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        using var peStream = new MemoryStream();
        var emitResult = entitiesCompilation.Emit(peStream, cancellationToken: cancellationToken);
        Assert.True(emitResult.Success, "Entity compilation failed: " + string.Join("; ", emitResult.Diagnostics.Select(static d => d.ToString())));

        peStream.Position = 0;
        var entitiesRef = MetadataReference.CreateFromStream(peStream);

        var hostCompilation = CSharpCompilation.Create(
            "SeedData",
            [CSharpSyntaxTree.ParseText("// host")],
            [entitiesRef, MetadataReference.CreateFromFile(typeof(object).Assembly.Location)],
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));

        GeneratorDriver driver = CSharpGeneratorDriver.Create(new EntityRecordGenerator());
        driver = driver.RunGenerators(hostCompilation, cancellationToken);
        var runResult = driver.GetRunResult();

        var generated = runResult.GeneratedTrees.Length > 0
            ? runResult.GeneratedTrees[0]
                       .GetText()
                       .ToString()
            : "";

        return (generated, runResult.Diagnostics);
    }

    /// <summary>Gets metadata references from the current runtime so BCL types (DateTime, ICollection, etc.) resolve.</summary>
    private static MetadataReference[] GetMetadataReferences()
    {
        var types = new[]
        {
            typeof(object), typeof(DateTime), typeof(List<>), typeof(ICollection<>)
        };

        return types
               .Select(static t => t.Assembly)
               .Distinct()
               .Where(static a => !string.IsNullOrEmpty(a.Location))
               .Select(static a => MetadataReference.CreateFromFile(a.Location))
               .ToArray();
    }
}