import csv
import json

input_files = [
    "items.tsv",
    "socketables.tsv"
]
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

combined_data = []
seen_hex_codes = set()
ignored_hex_codes = {}
name_overrides = {}

def load_data_from_csv(file_path, columnName):
    data = {}
    with open(file_path, "r", encoding="utf-8") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            data[row["hexCode"]] = row[columnName]
    return data

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
name_overrides = load_data_from_csv("name_overrides.csv", "newName")
ignored_hex_codes  =load_data_from_csv("ignored_hex_codes.csv","name")
for file_path in input_files:
    with open(file_path, "r", encoding="utf-8") as tsv_file:
        reader = csv.DictReader(tsv_file, delimiter="\t")

        for row in reader:
            name = clean_text(row.get("name", "Unknown"), remove_substrings)

            if "\\n" in name:
                name = name.split("\\n")[-1].strip()

            if name.lower() == "unused":
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
            })

with open("itemCode.json", "w", encoding="utf-8") as json_file:
    json.dump(combined_data, json_file, indent=4, ensure_ascii=False)
