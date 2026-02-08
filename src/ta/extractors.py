from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
import re
from typing import Iterable, Sequence

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


@dataclass(frozen=True)
class _Line:
    page: int
    raw: str
    normalized: str


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


def _to_half_width(value: str) -> str:
    def _convert(match: re.Match[str]) -> str:
        return chr(ord(match.group(0)) - 0xFEE0)

    return (
        re.sub(r"[０-９]", _convert, value)
        .replace("，", ",")
        .replace("－", "-")
        .replace("ー", "-")
    )


def _normalize_line(line: str) -> str:
    return _to_half_width(re.sub(r"\s+", " ", line).strip())


def _parse_numbers(text: str) -> list[int]:
    numbers = []
    for match in re.findall(r"-?\d[\d,]*", text):
        try:
            numbers.append(int(match.replace(",", "")))
        except ValueError:
            continue
    return numbers


def _build_lines(pages_text: Sequence[str]) -> list[_Line]:
    lines: list[_Line] = []
    for page_index, page_text in enumerate(pages_text, start=1):
        for raw in page_text.splitlines():
            normalized = _normalize_line(raw)
            if normalized:
                lines.append(_Line(page=page_index, raw=raw.strip(), normalized=normalized))
    return lines


def _detect_unit(lines: Sequence[_Line]) -> str | None:
    unit_line = next((line for line in lines if "単位" in line.normalized), None)
    if not unit_line:
        return None
    for unit in ("百万円", "千円", "億円"):
        if unit in unit_line.normalized:
            return unit
    return None


def _find_section_indices(lines: Sequence[_Line], keywords: Sequence[str]) -> list[int]:
    indices: list[int] = []
    for index, line in enumerate(lines):
        if any(keyword in line.normalized for keyword in keywords):
            indices.append(index)
    return indices


def _slice_around(lines: Sequence[_Line], indices: Sequence[int], radius: int = 20) -> list[_Line]:
    if not indices:
        return list(lines)
    selected: list[_Line] = []
    for index in indices:
        start = max(index - radius, 0)
        end = min(index + radius + 1, len(lines))
        selected.extend(lines[start:end])
    return selected


def _find_metric_line(lines: Sequence[_Line], keyword: str) -> _Line | None:
    candidates = [
        line for line in lines if keyword in line.normalized and _parse_numbers(line.normalized)
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda line: len(_parse_numbers(line.normalized)))


def _format_value(value: int, unit: str | None) -> str:
    formatted = f"{value:,}"
    if unit:
        return f"{formatted} ({unit})"
    return formatted


def _extract_metric(
    lines: Sequence[_Line],
    keyword: str,
    unit: str | None,
    section_keywords: Sequence[str],
) -> ExtractionItem:
    section_indices = _find_section_indices(lines, section_keywords)
    focus_lines = _slice_around(lines, section_indices, radius=25)
    line = _find_metric_line(focus_lines, keyword) or _find_metric_line(lines, keyword)
    if not line:
        return _default_unknown(f"{keyword}を抽出できませんでした")
    numbers = _parse_numbers(line.normalized)
    if not numbers:
        return _default_unknown(f"{keyword}の数値を抽出できませんでした")
    value = _format_value(numbers[0], unit)
    return ExtractionItem(
        value=value,
        evidence=Evidence(
            page=line.page,
            snippet=line.raw,
            notes=f"{keyword}を検出",
            confidence=0.7,
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
    lines = _build_lines(pages_text)
    unit = _detect_unit(lines)

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

    if lines:
        results["net_sales"] = _extract_metric(
            lines,
            "売上高",
            unit,
            ("連結経営成績", "経営成績"),
        )
        results["operating_profit"] = _extract_metric(
            lines,
            "営業利益",
            unit,
            ("連結経営成績", "経営成績"),
        )

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
