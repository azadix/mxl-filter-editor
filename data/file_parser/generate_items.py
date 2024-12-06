import csv
import json

input_files = [
    "items.tsv",
    "socketables.tsv"
]
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
combined_data = []
seen_hex_codes = set()


def string_to_decimal_little_endian(hex_string):
    padded_string = hex_string.ljust(4, ' ')
    hex_values = [format(ord(char), "02x") for char in padded_string]
    little_endian_hex = "".join(reversed(hex_values))
    return int(little_endian_hex, 16)

def clean_text(text, substrings):
    for substring in substrings:
        text = text.replace(substring, "")
    return text.strip()

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
            if hex_code in seen_hex_codes:
                continue

            seen_hex_codes.add(hex_code)
            decimal_value = string_to_decimal_little_endian(hex_code)

            combined_data.append({
                "name": name,
                "value": decimal_value,
                "hexCode": hex_code,
                "description": clean_text(row.get("spelldescstr", ""), remove_substrings)
            })

with open(output_file, "w", encoding="utf-8") as json_file:
    json.dump(combined_data, json_file, indent=4, ensure_ascii=False)
