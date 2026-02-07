from dataclasses import dataclass


@dataclass(frozen=True)
class FieldSpec:
    key: str
    label: str
    quote: bool


FIELDS = [
    FieldSpec("company_name", "会社名", False),
    FieldSpec("securities_code", "証券コード", False),
    FieldSpec("fiscal_period", "対象期間", True),
    FieldSpec("summary", "サマリー", True),
    FieldSpec("net_sales", "売上高", True),
    FieldSpec("operating_profit", "営業利益", True),
    FieldSpec("ordinary_profit", "経常利益", True),
    FieldSpec("net_profit", "当期純利益", True),
    FieldSpec("eps", "EPS", True),
    FieldSpec("dividend", "配当", True),
    FieldSpec("risk", "リスク", True),
]
