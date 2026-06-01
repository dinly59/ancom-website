import os
import json
from pathlib import Path


def main():
    repo_root = Path(__file__).resolve().parents[1]
    data_dir = repo_root / 'data'
    out_file = data_dir / 'index.json'

    files = [f.name for f in data_dir.iterdir() if f.is_file() and f.suffix.lower() == '.json' and f.name != out_file.name]
    files.sort()

    with open(out_file, 'w', encoding='utf-8') as fh:
        json.dump(files, fh, indent=2, ensure_ascii=False)

    print(f'Wrote {out_file} with {len(files)} entries')


if __name__ == '__main__':
    main()
