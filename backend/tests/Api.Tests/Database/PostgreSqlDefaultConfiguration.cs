using Testcontainers.PostgreSql;

namespace ClutterStock.Api.Tests.Database;

#pragma warning disable S2094 // Classes should not be empty
public sealed class PostgreSqlDefaultConfiguration() : PostgreSqlContainerTest(new PostgreSqlBuilder("postgres:16-alpine")
                                                                                   .Build());
#pragma warning restore S2094 // Classes should not be empty
