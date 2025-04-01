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

def load_config():
    with open("changes.json", "r", encoding="utf-8") as config_file:
        return json.load(config_file)

def string_to_decimal_little_endian(hex_string):
    padded_string = hex_string.ljust(4, ' ')
    hex_values = [format(ord(char), "02x") for char in padded_string]
    little_endian_hex = "".join(reversed(hex_values))
    return int(little_endian_hex, 16)

def clean_text(text, substrings):
    for substring in substrings:
        text = text.replace(substring, "")
    return text.strip()

def process_items(config):
    combined_data = []
    seen_hex_codes = set()

    for file_path in input_files:
        with open(file_path, "r", encoding="utf-8") as tsv_file:
            reader = csv.DictReader(tsv_file, delimiter="\t")

            for row in reader:
                name = clean_text(row.get("name", "Unknown"), remove_substrings)

                # \n removal must be kept since items may have 2 or more parts
                if "\\n" in name:
                    name = name.split("\\n")[-1].strip()

                if name.lower() == "unused":
                    continue

                hex_code = row["#code"]
                if hex_code in seen_hex_codes or hex_code in config["ignored_hex_codes"]:
                    continue

                # Apply name override if available
                if hex_code in config["name_overrides"]:
                    name = config["name_overrides"][hex_code]

                seen_hex_codes.add(hex_code)
                decimal_value = string_to_decimal_little_endian(hex_code)

                # Determine the categories based on row['type']
                item_categories = []
                if row.get("type"):
                    # Split the type field by commas to handle multiple categories
                    type_list = row["type"].split(",")
                    for type_str in type_list:
                        type_str = type_str.strip()
                        if type_str in config["item_categories"]:
                            item_categories.append(config["item_categories"][type_str])

                combined_data.append({
                    "name": name,
                    "value": decimal_value,
                    "hexCode": hex_code,
                    "category": item_categories,
                })
    return combined_data

def main():
    config = load_config()
    items_data = process_items(config)
    
    with open("itemCode.json", "w", encoding="utf-8") as json_file:
        json.dump(items_data, json_file, indent=4, ensure_ascii=False)

if __name__ == "__main__":
    import csv
    main()