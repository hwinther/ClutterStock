using System.Collections.Specialized;
using System.Web;
using Npgsql;

namespace ClutterStock.Api.Options;

/// <summary>
///     Converts a PostgreSQL URI (<c>postgres[ql]://[user[:password]@]host[:port][/database][?options]</c>)
///     to an ADO.NET connection string accepted by Npgsql. Falls back to the input value when it is
///     already in native key=value form.
/// </summary>
public static class PostgresUrlParser
{
    /// <summary>
    ///     Parses <paramref name="value" /> into an Npgsql ADO.NET connection string.
    /// </summary>
    public static string Parse(string value)
    {
        if (!value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
            !value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return value;

        var uri = new Uri(value);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
        };

        var database = uri.AbsolutePath.TrimStart('/');
        if (!string.IsNullOrEmpty(database))
            builder.Database = Uri.UnescapeDataString(database);

        if (!string.IsNullOrEmpty(uri.UserInfo))
        {
            var colon = uri.UserInfo.IndexOf(':');
            if (colon >= 0)
            {
                builder.Username = Uri.UnescapeDataString(uri.UserInfo[..colon]);
                builder.Password = Uri.UnescapeDataString(uri.UserInfo[(colon + 1)..]);
            }
            else
            {
                builder.Username = Uri.UnescapeDataString(uri.UserInfo);
            }
        }

        if (!string.IsNullOrEmpty(uri.Query))
        {
            NameValueCollection query = HttpUtility.ParseQueryString(uri.Query);
            foreach (var key in query.AllKeys)
            {
                if (string.IsNullOrEmpty(key)) continue;
                var v = query[key];
                if (v is not null) builder[key] = v;
            }
        }

        return builder.ConnectionString;
    }
}
