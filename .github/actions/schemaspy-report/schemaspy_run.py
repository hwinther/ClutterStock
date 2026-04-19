#!/usr/bin/env python3
"""Build SchemaSpy docker argv from database_type and a .NET-style connection string."""

from __future__ import annotations

import os
import re
import shlex
import subprocess
import sys
from pathlib import Path


def parse_connection_string(raw: str) -> dict[str, str]:
    parts: dict[str, str] = {}
    for seg in raw.split(";"):
        seg = seg.strip()
        if not seg or "=" not in seg:
            continue
        key, _, value = seg.partition("=")
        parts[key.strip().lower()] = value.strip()
    return parts


def docker_reachable_host(host: str) -> str:
    if host.lower() in ("localhost", "127.0.0.1", "::1"):
        return "host.docker.internal"
    return host


def parse_server_host_port(server: str) -> tuple[str, str | None]:
    """Parse Data Source / Server for SQL Server and MySQL styles."""
    s = server.strip()
    m = re.match(r"tcp:([^,]+),(\d+)\s*$", s, re.IGNORECASE)
    if m:
        return m.group(1), m.group(2)
    m = re.match(r"^([^,]+),(\d+)\s*$", s)
    if m and re.fullmatch(r"\d+", m.group(2)):
        return m.group(1), m.group(2)
    if "\\" in s:
        s = s.split("\\", 1)[0]
    return s, None


def print_sqlite_path_for_migrator() -> None:
    """Emit the resolved SQLite file path for the migrator pre-delete step (stdout only)."""
    cs = os.environ["CONNECTION_STRING"].strip()
    workspace = Path(os.environ["GITHUB_WORKSPACE"]).resolve()
    working_dir = os.environ["WORKING_DIRECTORY"].strip()
    parts = parse_connection_string(cs)
    path = sqlite_file_path(parts, workspace, working_dir)
    print(path, end="")


def sqlite_file_path(parts: dict[str, str], workspace: Path, working_dir: str) -> Path:
    for key in ("data source", "datasource", "filename"):
        if key in parts:
            p = Path(parts[key])
            if not p.is_absolute():
                p = (workspace / working_dir / p).resolve()
            return p.resolve()
    raise SystemExit(
        "SQLite connection_string must include Data Source= or Filename= pointing to the database file."
    )


def log_command(argv: list[str]) -> None:
    redacted: list[str] = []
    skip_next = False
    for a in argv:
        if skip_next:
            redacted.append("***")
            skip_next = False
            continue
        if a == "-p":
            redacted.append(a)
            skip_next = True
        else:
            redacted.append(a)
    print("Running:", " ".join(shlex.quote(c) for c in redacted), file=sys.stderr)


def main() -> None:
    db_type = os.environ["DATABASE_TYPE"].strip().lower()
    cs = os.environ["CONNECTION_STRING"].strip()
    drivers = Path(os.environ["SCHEMASPY_DRIVERS_PATH"]).resolve()
    output = Path(os.environ["SCHEMASPY_OUTPUT_PATH"]).resolve()
    workspace = Path(os.environ["GITHUB_WORKSPACE"]).resolve()
    working_dir = os.environ["WORKING_DIRECTORY"].strip()

    parts = parse_connection_string(cs)
    if not parts:
        sys.exit("connection_string is empty or could not be parsed.")

    docker_bin = os.environ.get("DOCKER", "docker")
    image = os.environ.get("SCHEMASPY_IMAGE", "schemaspy/schemaspy:latest")

    volume_mounts: list[str] = []
    spy_args: list[str] = ["-dp", "/drivers", "-cat", "%"]

    if db_type in ("sqlite", "sqlite3"):
        db_path = sqlite_file_path(parts, workspace, working_dir)
        if not db_path.is_file():
            sys.exit(f"SQLite database file does not exist: {db_path}")
        workdir = Path(os.environ["SCHEMASPY_SQLITE_WORKDIR"]).resolve()
        workdir.mkdir(parents=True, exist_ok=True)
        dest = workdir / "schemaspy.db"
        dest.write_bytes(db_path.read_bytes())
        dest.chmod(0o666)
        workdir.chmod(0o777)
        volume_mounts.extend(["-v", f"{workdir}:/workspace"])
        spy_args.extend(
            [
                "-t",
                "sqlite-xerial",
                "-db",
                "/workspace/schemaspy.db",
                "-u",
                "schemaspy",
                "-s",
                "main",
            ]
        )
    elif db_type in ("mssql", "sqlserver", "sql server"):
        server = parts.get("server") or parts.get("data source")
        if not server:
            sys.exit("MSSQL connection_string must include Server= or Data Source=.")
        if (parts.get("integrated security") or "").lower() in ("true", "sspi", "yes"):
            sys.exit(
                "Integrated Security is not supported by this action; use SQL authentication (User Id and Password)."
            )
        host, port_from_server = parse_server_host_port(server)
        port = parts.get("port") or port_from_server or "1433"
        database = parts.get("database") or parts.get("initial catalog")
        user = parts.get("user id") or parts.get("uid") or parts.get("user")
        password = parts["password"] if "password" in parts else parts.get("pwd")
        if not database or not user or password is None:
            sys.exit(
                "MSSQL connection_string must include Database= (or Initial Catalog=), User Id= (or UID=), and Password= (or Pwd=)."
            )
        host = docker_reachable_host(host.strip())
        spy_args.extend(
            [
                "-t",
                "mssql",
                "-host",
                host,
                "-port",
                str(port),
                "-db",
                database,
                "-u",
                user,
                "-p",
                password,
                "-s",
                "dbo",
            ]
        )
    elif db_type in ("postgres", "postgresql", "pgsql"):
        host = parts.get("host") or parts.get("server")
        if not host:
            sys.exit("PostgreSQL connection_string must include Host= (or Server=).")
        host = docker_reachable_host(host.strip())
        port = parts.get("port") or "5432"
        database = parts.get("database") or parts.get("db")
        user = (
            parts.get("username")
            or parts.get("user id")
            or parts.get("userid")
            or parts.get("uid")
        )
        password = parts["password"] if "password" in parts else parts.get("pwd")
        if not database or not user or password is None:
            sys.exit(
                "PostgreSQL connection_string must include Database= (or Db=), Username= (or User Id= / Uid=), and Password= (or Pwd=)."
            )
        spy_args.extend(
            [
                "-t",
                "pgsql",
                "-host",
                host,
                "-port",
                str(port),
                "-db",
                database,
                "-u",
                user,
                "-p",
                password,
                "-s",
                "public",
            ]
        )
    elif db_type in ("mysql", "mariadb"):
        server = parts.get("server") or parts.get("data source")
        if not server:
            sys.exit("MySQL connection_string must include Server= or Data Source=.")
        host, port_from_server = parse_server_host_port(server)
        port = parts.get("port") or port_from_server or "3306"
        database = parts.get("database")
        user = parts.get("uid") or parts.get("user id") or parts.get("userid") or parts.get("user")
        password = parts["password"] if "password" in parts else parts.get("pwd")
        if not database or not user or password is None:
            sys.exit("MySQL connection_string must include Database=, Uid= (or User Id=), and Password= (or Pwd=).")
        host = docker_reachable_host(host.strip())
        spy_args.extend(
            [
                "-t",
                "mysql",
                "-host",
                host,
                "-port",
                str(port),
                "-db",
                database,
                "-u",
                user,
                "-p",
                password,
                "-s",
                database,
            ]
        )
    else:
        sys.exit(
            f"Unsupported database_type {db_type!r}. Use sqlite, mssql, postgres, or mysql."
        )

    cmd: list[str] = [
        docker_bin,
        "run",
        "--rm",
        "--add-host=host.docker.internal:host-gateway",
        *volume_mounts,
        "-v",
        f"{drivers}:/drivers",
        "-v",
        f"{output}:/output",
        image,
        *spy_args,
    ]

    output.mkdir(parents=True, exist_ok=True)
    output.chmod(0o777)

    log_command(cmd)
    subprocess.check_call(cmd)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--print-sqlite-path-for-migrator":
        print_sqlite_path_for_migrator()
    else:
        main()
