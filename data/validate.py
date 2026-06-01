import json
import sys
from jsonschema import Draft7Validator

def load_json(path):
    try:
        return json.load(open(path))
    except Exception as e:
        print(f'Failed to load {path}:', e)
        sys.exit(2)

schema = load_json('product-schema.json')
data = load_json('SST-STB2.json')

validator = Draft7Validator(schema)
errors = sorted(validator.iter_errors(data), key=lambda e: list(e.path))
if errors:
    print('Validation errors:')
    for e in errors:
        path = '.'.join(map(str, e.path))
        print(f'- {path}: {e.message}')
    sys.exit(1)
print('Valid')
