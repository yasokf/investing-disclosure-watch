from ta.constants import FIELDS
from ta.extractors import ExtractionItem, Evidence
from ta.tsv import build_tsv_row


def test_tsv_columns() -> None:
    items = {}
    for field in FIELDS:
        items[field.key] = ExtractionItem(
            value=f"{field.key}-value",
            evidence=Evidence(page=None, snippet=None, notes="", confidence=0.5),
        )
    row = build_tsv_row(items)
    assert len(row.split("\t")) == 11
