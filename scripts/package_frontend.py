#!/usr/bin/env python3
"""Create a local, static frontend release without modifying the working files."""

import argparse
from datetime import datetime, timezone
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import re
import sys
import tarfile
import tempfile


PROJECT_ROOT = Path(__file__).resolve().parent.parent
RUNTIME_FILES = (
    "index.html",
    "style.css",
    "script.js",
    "api.js",
    "config.js",
    "data-state.js",
    "data/demo-assets.js",
    "favicon.svg",
)
# Only the existing, standalone mode property is changed. Do not execute JavaScript.
MODE_PROPERTY = re.compile(
    r'^(?P<prefix>[ \t]*mode:[ \t]*)(?P<quote>[\'\"])(?:demo|api)'
    r'(?P=quote)(?P<suffix>[ \t]*,[ \t]*(?://[^\r\n]*)?)$',
    re.MULTILINE,
)


def runtime_contents(mode):
    """Read the explicit allowlist and replace the packaged config's mode only."""
    contents = {}
    for name in RUNTIME_FILES:
        path = PROJECT_ROOT / name
        relative_parts = path.relative_to(PROJECT_ROOT).parts
        checked_path = PROJECT_ROOT
        for part in relative_parts:
            checked_path /= part
            if checked_path.is_symlink():
                raise ValueError(f"Runtime files must not use symlinks: {name}")
        if not path.is_file():
            raise ValueError(f"Required runtime file is missing: {name}")
        contents[name] = path.read_bytes()

    original_config = contents["config.js"].decode("utf-8")
    matches = list(MODE_PROPERTY.finditer(original_config))
    # Reject a changed/ambiguous config rather than silently creating the wrong mode.
    if len(matches) != 1 or len(re.findall(r"\bmode\s*:", original_config)) != 1:
        raise ValueError("config.js must have exactly one standalone demo/api mode property")
    match = matches[0]
    replacement = f'{match["prefix"]}{match["quote"]}{mode}{match["quote"]}{match["suffix"]}'
    contents["config.js"] = (
        original_config[: match.start()] + replacement + original_config[match.end() :]
    ).encode("utf-8")
    return contents


def create_release(mode, output_dir):
    contents = runtime_contents(mode)
    output_dir = output_dir.expanduser().resolve()
    if output_dir == Path(output_dir.anchor) or output_dir == PROJECT_ROOT:
        raise ValueError("Choose a dedicated release output directory")
    output_dir.mkdir(parents=True, exist_ok=True)
    archive_path = output_dir / f"eti300w-frontend-{mode}.tar.gz"
    manifest_path = output_dir / f"eti300w-frontend-{mode}.manifest.json"
    for path in (archive_path, manifest_path):
        if path.is_symlink() or (path.exists() and not path.is_file()):
            raise ValueError(f"Output must be a regular file: {path.name}")

    built_at = datetime.now(timezone.utc).replace(microsecond=0)
    built_utc = built_at.isoformat().replace("+00:00", "Z")
    timestamp = int(built_at.timestamp())
    temporary_paths = []
    try:
        with tempfile.NamedTemporaryFile(dir=output_dir, delete=False) as temporary:
            temporary_paths.append(Path(temporary.name))
            with gzip.GzipFile(filename="", mode="wb", fileobj=temporary, mtime=timestamp) as zipped:
                with tarfile.open(fileobj=zipped, mode="w", format=tarfile.PAX_FORMAT) as archive:
                    for name, payload in contents.items():
                        entry = tarfile.TarInfo(name=name)
                        entry.size = len(payload)
                        entry.mode = 0o644
                        entry.mtime = timestamp
                        archive.addfile(entry, io.BytesIO(payload))
        archive_bytes = temporary_paths[0].read_bytes()
        manifest = {
            "schemaVersion": 1,
            "builtUTC": built_utc,
            "mode": mode,
            "archive": {
                "name": archive_path.name,
                "sha256": hashlib.sha256(archive_bytes).hexdigest(),
                "bytes": len(archive_bytes),
            },
            "files": [
                {"path": name, "sha256": hashlib.sha256(payload).hexdigest(), "bytes": len(payload)}
                for name, payload in contents.items()
            ],
        }
        with tempfile.NamedTemporaryFile(dir=output_dir, mode="w", encoding="utf-8", delete=False) as temporary:
            temporary_paths.append(Path(temporary.name))
            json.dump(manifest, temporary, indent=2)
            temporary.write("\n")
        os.replace(temporary_paths[0], archive_path)
        os.replace(temporary_paths[1], manifest_path)
    finally:
        for path in temporary_paths:
            path.unlink(missing_ok=True)
    return archive_path, manifest_path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=("demo", "api"), default="api", help="Mode inside the release (default: api)")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=PROJECT_ROOT / ".artifacts" / "release",
        help="Local output directory (default: .artifacts/release)",
    )
    args = parser.parse_args()
    try:
        archive_path, manifest_path = create_release(args.mode, args.output_dir)
    except (OSError, UnicodeError, ValueError) as error:
        print(f"Release not created: {error}", file=sys.stderr)
        return 1
    print(f"Created {archive_path}")
    print(f"Manifest {manifest_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
