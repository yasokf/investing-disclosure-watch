from ta.constants import FIELDS
from ta.extractors import ExtractionItem


def _escape_cell(value: str) -> str:
    return value.replace('"', '""').replace("\t", " ")


def build_tsv_row(items: dict[str, ExtractionItem]) -> str:
    cells: list[str] = []
    for spec in FIELDS:
        value = items[spec.key].value
        escaped = _escape_cell(value)
        if spec.quote:
            cells.append(f'"{escaped}"')
        else:
            cells.append(escaped)
    return "\t".join(cells)
