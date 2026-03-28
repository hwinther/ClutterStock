using System.Reflection;
using System.Text;

namespace ClutterStock.Api.Extensions;

/// <summary>
///     Reads version info baked in at publish (<c>InformationalVersion</c>, <c>SourceRevisionId</c>).
/// </summary>
internal static class ApiBuildMetadata
{
    public static string BuildOpenApiDescription(string introduction)
    {
        var asm = Assembly.GetExecutingAssembly();
        var informational =
            asm.GetCustomAttribute<AssemblyInformationalVersionAttribute>()
               ?.InformationalVersion;

        var (semver, commitFromInfo) = ParseInformationalVersion(informational);
        var commit = !string.IsNullOrWhiteSpace(commitFromInfo)
            ? commitFromInfo
            : GetSourceRevisionId(asm);

        var sb = new StringBuilder();
        sb.AppendLine(introduction.TrimEnd());
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(semver))
        {
            sb.Append("**Version:** `");
            sb.Append(semver);
            sb.AppendLine("`");
        }
        else if (!string.IsNullOrWhiteSpace(informational))
        {
            sb.Append("**Version:** `");
            sb.Append(informational);
            sb.AppendLine("`");
        }

        if (!string.IsNullOrWhiteSpace(commit))
        {
            sb.Append("**Git SHA:** `");
            sb.Append(commit);
            sb.AppendLine("`");
        }

        return sb.ToString()
                 .Replace("\r\n", "\n")
                 .TrimEnd();
    }

    private static (string SemVer, string? Commit) ParseInformationalVersion(string? informational)
    {
        if (string.IsNullOrWhiteSpace(informational))
            return ("", null);

        var trimmed = informational.Trim();
        var plus = trimmed.IndexOf('+');
        if (plus < 0)
            return (trimmed, null);

        var semver = trimmed[..plus]
            .Trim();

        var commit = trimmed[(plus + 1)..]
            .Trim();

        return (semver, string.IsNullOrEmpty(commit) ? null : commit);
    }

    private static string? GetSourceRevisionId(Assembly asm)
    {
        foreach (var meta in asm.GetCustomAttributes<AssemblyMetadataAttribute>())
        {
            if (string.Equals(meta.Key, "SourceRevisionId", StringComparison.OrdinalIgnoreCase))
                return string.IsNullOrWhiteSpace(meta.Value) ? null : meta.Value.Trim();
        }

        return null;
    }
}