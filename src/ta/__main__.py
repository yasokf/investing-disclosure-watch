from __future__ import annotations

import argparse
from pathlib import Path

from ta.pipeline import Paths, batch_process, watch_process


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Tanshin PDF analyzer")
    subparsers = parser.add_subparsers(dest="command", required=True)

    batch = subparsers.add_parser("batch", help="Process all PDFs in input directory")
    batch.add_argument("--input", default="input", help="Input directory")
    batch.add_argument("--output", default="output", help="Output directory")

    watch = subparsers.add_parser("watch", help="Watch input directory and process PDFs")
    watch.add_argument("--input", default="input", help="Input directory")
    watch.add_argument("--output", default="output", help="Output directory")
    return parser


def main() -> None:
    parser = _build_parser()
    args = parser.parse_args()

    paths = Paths(input_dir=Path(args.input), output_dir=Path(args.output))

    if args.command == "batch":
        processed = batch_process(paths)
        print(f"processed: {processed}")
    elif args.command == "watch":
        print("watching for new PDFs...")
        watch_process(paths)


if __name__ == "__main__":
    main()
