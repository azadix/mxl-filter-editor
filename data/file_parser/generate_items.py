import json
import csv
from typing import List, Dict, Set, Any

# Constants
INPUT_FILES = ["items.tsv", "socketables.tsv"]
REMOVE_SUBSTRINGS = [
    "\\red;",
    "\\blue;",
    "\\dgrey;",
    "\\grey;",
    "\\orange;",
    "\\yellow;",
    "\\dgreen;",
    "\\green;",
    "\\gold;",
    "\\purple;",
    ";"
]
CONFIG_FILE = "overrides.json"
OUTPUT_FILE = "../itemCode.json"

def load_config() -> Dict[str, Any]:
    """Loads configuration from JSON file."""
    with open(CONFIG_FILE, "r", encoding="utf-8") as config_file:
        return json.load(config_file)

def string_to_decimal_little_endian(hex_string: str) -> int:
    """Converts a hex string to a little-endian decimal value."""
    padded = hex_string.ljust(4, ' ')
    return int.from_bytes(padded.encode('utf-8'), 'little')

def clean_text(text: str, substrings: Set[str]) -> str:
    """Cleans text by removing specified substrings."""
    for substr in substrings:
        text = text.replace(substr, "")
    return text.strip()

def process_items(config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Processes TSV files into structured item data."""
    combined_data = []
    seen_hex_codes = set()

    for file_path in INPUT_FILES:
        try:
            with open(file_path, "r", encoding="utf-8") as tsv_file:
                reader = csv.DictReader(tsv_file, delimiter="\t")
                
                for row in reader:
                    if not (hex_code := row.get("#code")):
                        continue
                        
                    name = clean_text(row.get("name", "Unknown"), REMOVE_SUBSTRINGS)
                    if "\\n" in name:
                        name = name.split("\\n")[-1].strip()
                    if name.lower() == "unused":
                        continue
                    if hex_code in seen_hex_codes or hex_code in config["ignored_hex_codes"]:
                        continue

                    name = config["name_overrides"].get(hex_code, name)
                    seen_hex_codes.add(hex_code)
                    
                    # Get categories from override if exists, otherwise from TSV
                    if hex_code in config.get("category_overrides", {}):
                        categories = [
                            config["item_categories"][cat]
                            for cat in config["category_overrides"][hex_code]
                            if cat in config["item_categories"]
                        ]
                    else:
                        categories = [
                            config["item_categories"][t.strip()]
                            for t in row.get("type", "").split(",")
                            if t.strip() in config["item_categories"]
                        ]
                    
                    combined_data.append({
                        "name": name,
                        "value": string_to_decimal_little_endian(hex_code),
                        "hex": hex_code,
                        "category": categories,
                    })
        except FileNotFoundError:
            print(f"File {file_path} not found")
            
    return combined_data

def main():
    """Main processing function."""
    config = load_config()
    items_data = process_items(config)
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as json_file:
        json.dump(items_data, json_file, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    main()
