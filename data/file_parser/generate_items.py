import csv
import json

input_files = [
    "items.tsv",
    "socketables.tsv"
]
name_override_file = "name_overrides.csv"
output_file = "itemCode.json"
remove_substrings = [
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
hex_values_to_ignore = [
    "dy99", # Mystic Dye 99
    "dr01", # Depleted Riftstone (1)
    "dr02", # Depleted Riftstone (2)
    "dr03", # Depleted Riftstone (3)
    "dr04", # Depleted Riftstone (4)
    "dr05", # Depleted Riftstone (5)
    "dr06", # Depleted Riftstone (1)
    "dr07", # Depleted Riftstone (2)
    "dr08", # Depleted Riftstone (3)
    "dr09", # Depleted Riftstone (4)
    "dr10", # Depleted Riftstone (5)
    "dr11", # Depleted Riftstone (6)
    "dr12", # Depleted Riftstone (7)
    "dr13", # Depleted Riftstone (8)
    "dr14", # Depleted Riftstone (9)
    "dr15", # Depleted Riftstone (10)
    "ir01", # Charged Riftstone (1)
    "ir02", # Charged Riftstone (2)
    "ir03", # Charged Riftstone (3)
    "ir04", # Charged Riftstone (4)
    "ir05", # Charged Riftstone (5)
    "ir06", # Charged Riftstone (1)
    "ir07", # Charged Riftstone (2)
    "ir08", # Charged Riftstone (3)
    "ir09", # Charged Riftstone (4)
    "ir10", # Charged Riftstone (5)
    "ir11", # Charged Riftstone (6)
    "ir12", # Charged Riftstone (7)
    "ir13", # Charged Riftstone (8)
    "ir14", # Charged Riftstone (9)
    "ir15", # Charged Riftstone (10)
    "ktax", # Pulsating Worldstone Shard
    "ktbx", # Pulsating Worldstone Shard
    "ktcx", # Pulsating Worldstone Shard
    "ktdx", # Pulsating Worldstone Shard
    "ktex" # Pulsating Worldstone Shard
]

combined_data = []
seen_hex_codes = set()
ignored_hex_codes = set(hex_values_to_ignore)
name_overrides = {}

def load_name_overrides(file_path):
    overrides = {}
    with open(file_path, "r", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            overrides[row["hexCode"]] = row["newName"]
    return overrides

def string_to_decimal_little_endian(hex_string):
    padded_string = hex_string.ljust(4, ' ')
    hex_values = [format(ord(char), "02x") for char in padded_string]
    little_endian_hex = "".join(reversed(hex_values))
    return int(little_endian_hex, 16)

def clean_text(text, substrings):
    for substring in substrings:
        text = text.replace(substring, "")
    return text.strip()

# Load name overrides
name_overrides = load_name_overrides(name_override_file)

for file_path in input_files:
    with open(file_path, "r", encoding="utf-8") as tsv_file:
        reader = csv.DictReader(tsv_file, delimiter="\t")
        if not combined_data:
            print(f"Available columns in {file_path}: {reader.fieldnames}")

        for row in reader:
            name = clean_text(row.get("name", "Unknown"), remove_substrings)

            if "\\n" in name:
                name = name.split("\\n")[-1].strip()

            if name.lower() == "unused" or name == "FLYING POLAR BUFFALO ERROR":
                continue

            hex_code = row["#code"]
            if hex_code in seen_hex_codes or hex_code in ignored_hex_codes:
                continue

            # Apply name override if available
            if hex_code in name_overrides:
                name = name_overrides[hex_code]

            seen_hex_codes.add(hex_code)
            decimal_value = string_to_decimal_little_endian(hex_code)

            combined_data.append({
                "name": name,
                "value": decimal_value,
                "hexCode": hex_code,
                #"description": clean_text(row.get("spelldescstr", ""), remove_substrings)
            })

with open(output_file, "w", encoding="utf-8") as json_file:
    json.dump(combined_data, json_file, indent=4, ensure_ascii=False)
