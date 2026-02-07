from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import hashlib
import json
from pathlib import Path
from typing import Iterable

from ta.extractors import extract_from_pdf, serialize_extraction
from ta.tsv import build_tsv_row


@dataclass(frozen=True)
class Paths:
    input_dir: Path
    output_dir: Path


def ensure_dirs(paths: Paths) -> None:
    paths.input_dir.mkdir(parents=True, exist_ok=True)
    paths.output_dir.mkdir(parents=True, exist_ok=True)


def _hash_file(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            sha.update(chunk)
    return sha.hexdigest()


def _done_path(output_dir: Path) -> Path:
    return output_dir / ".done.json"


def load_done(output_dir: Path) -> dict[str, dict[str, str]]:
    done_file = _done_path(output_dir)
    if not done_file.exists():
        return {}
    try:
        return json.loads(done_file.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def save_done(output_dir: Path, data: dict[str, dict[str, str]]) -> None:
    done_file = _done_path(output_dir)
    done_file.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _log_path(output_dir: Path, base_name: str) -> Path:
    return output_dir / f"{base_name}.log"


def _write_log(output_dir: Path, base_name: str, lines: Iterable[str]) -> None:
    log_path = _log_path(output_dir, base_name)
    log_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def process_pdf(path: Path, paths: Paths) -> bool:
    ensure_dirs(paths)
    done = load_done(paths.output_dir)
    file_hash = _hash_file(path)
    base_name = path.stem
    log_lines: list[str] = []
    log_lines.append(f"[{datetime.now().isoformat()}] start: {path}")

    if file_hash in done:
        log_lines.append("skip: same hash already processed")
        _write_log(paths.output_dir, base_name, log_lines)
        return False

    items = extract_from_pdf(str(path))
    processed_at = datetime.now()
    tsv_row = build_tsv_row(items)
    json_payload = serialize_extraction(
        items,
        source_file=path.name,
        file_hash=file_hash,
        processed_at=processed_at,
    )

    (paths.output_dir / f"{base_name}.tsv").write_text(tsv_row + "\n", encoding="utf-8")
    (paths.output_dir / f"{base_name}.json").write_text(
        json.dumps(json_payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    done[file_hash] = {"file": path.name, "processed_at": processed_at.isoformat()}
    save_done(paths.output_dir, done)

    log_lines.append("success: outputs generated")
    _write_log(paths.output_dir, base_name, log_lines)
    return True


def batch_process(paths: Paths) -> int:
    ensure_dirs(paths)
    count = 0
    for path in sorted(paths.input_dir.glob("*.pdf")):
        if process_pdf(path, paths):
            count += 1
    return count


def watch_process(paths: Paths) -> None:
    ensure_dirs(paths)
    from watchfiles import watch

    for changes in watch(paths.input_dir):
        for _, changed in changes:
            if not changed.lower().endswith(".pdf"):
                continue
            process_pdf(Path(changed), paths)
