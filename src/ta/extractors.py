from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import re
from typing import Iterable

from ta.constants import FIELDS


@dataclass
class Evidence:
    page: int | None
    snippet: str | None
    notes: str
    confidence: float


@dataclass
class ExtractionItem:
    value: str
    evidence: Evidence


def _first_non_empty_line(text: str) -> str | None:
    for line in text.splitlines():
        stripped = line.strip()
        if stripped:
            return stripped
    return None


def _find_securities_code(text: str) -> tuple[str | None, str | None]:
    match = re.search(r"\b(\d{4})\b", text)
    if not match:
        return None, None
    return match.group(1), match.group(0)


def _default_unknown(reason: str) -> ExtractionItem:
    return ExtractionItem(
        value="不明",
        evidence=Evidence(
            page=None,
            snippet=None,
            notes=reason,
            confidence=0.2,
        ),
    )


def extract_from_pdf(path: str) -> dict[str, ExtractionItem]:
    results: dict[str, ExtractionItem] = {}
    try:
        import pdfplumber

        with pdfplumber.open(path) as pdf:
            pages_text = [page.extract_text() or "" for page in pdf.pages]
    except Exception as exc:  # pragma: no cover - defensive
        reason = f"PDF読み込み失敗: {exc}"
        for field in FIELDS:
            results[field.key] = _default_unknown(reason)
        return results

    joined = "\n".join(pages_text)
    first_page = pages_text[0] if pages_text else ""

    company_line = _first_non_empty_line(first_page)
    if company_line:
        results["company_name"] = ExtractionItem(
            value=company_line,
            evidence=Evidence(
                page=1,
                snippet=company_line,
                notes="先頭行から推定",
                confidence=0.6,
            ),
        )
    else:
        results["company_name"] = _default_unknown("会社名を抽出できませんでした")

    code, snippet = _find_securities_code(joined)
    if code:
        results["securities_code"] = ExtractionItem(
            value=code,
            evidence=Evidence(
                page=None,
                snippet=snippet,
                notes="4桁コードを検出",
                confidence=0.6,
            ),
        )
    else:
        results["securities_code"] = _default_unknown("証券コード抽出ルール未実装")

    for field in FIELDS:
        if field.key in results:
            continue
        if field.key == "risk":
            results[field.key] = ExtractionItem(
                value="不明\n要確認: リスク抽出未実装",
                evidence=Evidence(
                    page=None,
                    snippet=None,
                    notes="リスク抽出未実装",
                    confidence=0.1,
                ),
            )
        else:
            results[field.key] = _default_unknown("抽出ルール未実装")

    return results


def serialize_extraction(
    items: dict[str, ExtractionItem],
    source_file: str,
    file_hash: str,
    processed_at: datetime,
) -> dict[str, dict[str, object]]:
    payload: dict[str, dict[str, object]] = {
        "_metadata": {
            "source_file": source_file,
            "file_hash": file_hash,
            "processed_at": processed_at.isoformat(),
        }
    }
    for key, item in items.items():
        payload[key] = {
            "value": item.value,
            "page": item.evidence.page,
            "snippet": item.evidence.snippet,
            "notes": item.evidence.notes,
            "confidence": item.evidence.confidence,
        }
    return payload
