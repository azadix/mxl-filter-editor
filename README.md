# Median XL Filter Editor

<img src="assets/logo.png" width="256" height="256">

A web-based tool for creating and editing item filters for Median XL (an overhaul mod for Diablo 2). This editor provides an enhanced interface with more features than the in-game filter editor.

**Current MedianXL version data:** MXL 2.11.0

## Features

### Enhanced Filter Management
- Save filters in browser's local storage
- Visual category tags (Quest items, Runes, etc.)
- More extensive item code list than the in-game editor
- Search by item name, class, or category
- Drag-and-drop reordering of rules

### Customizable Defaults
- Set default notification behavior
- Configure default map marker display

## Quick Start

1. **Creating a New Filter**
   - Click "New filter" or paste existing filter data (JSON format)
   - Give your filter a descriptive name

2. **Adding Rules**
   - Click "Add new rule" to create filtering rules
   - Configure each rule's parameters:
     - Item/Class selection
     - Quality and ethereal state requirements
     - Character and item level ranges
     - Notification and minimap marker settings

3. **Managing Rules**
   - Drag the handle (↕) to reorder rules
   - Use checkboxes to enable/disable rules
   - Click the trash icon to delete rules

4. **Save & Export**
   - Save to browser storage for later use
   - Click "Copy to clipboard" to export your filter for in-game use

## Technical Details

### Game Data
Median XL item data is sourced from the [MedianXLOfflineTools](https://github.com/kambala-decapitator/MedianXLOfflineTools) repository, provided by [@kambala-decapitator](https://github.com/kambala-decapitator).

| Asset name | Source | Link | Description |
|------------|--------|------|-------------|
| items.tsv | MedianXLOfflineTools | [`items.tsv`](https://github.com/kambala-decapitator/MedianXLOfflineTools/blob/main/utils/txt_parser/generated/en/items.tsv) | Contains most regular items, uniques, charms and other |
| socketables.tsv | MedianXLOfflineTools | [`socketables.tsv`](https://github.com/kambala-decapitator/MedianXLOfflineTools/blob/main/utils/txt_parser/generated/en/socketables.tsv) | Contains gems, runes |
| *.png | MedianXLOfflineTools | [`MedianXLOfflineTools/images`](https://github.com/kambala-decapitator/MedianXLOfflineTools/tree/main/resources/data/images/items) | Other images used as category icons |
| logo.png | OpenAI's ChatGPT | | App logo generated using ChatGPT |

### Third-Party Libraries
This project uses several open-source libraries:

| Library | Purpose | Version | Link |
|---------|---------|:-------:|------|
| jQuery | DOM manipulation | 3.7.1 | [jquery.com](https://jquery.com/) |
| Bulma CSS | CSS framework | 1.0.1 | [bulma.io](https://bulma.io/) |
| DataTables | Table interaction | 2.2.2 | [datatables.net](https://datatables.net/) |
| SortableJS | Drag-and-drop functionality | 1.14.0 | [SortableJS](https://sortablejs.github.io/Sortable/) |
| FontAwesome | Icons | 5.15.4 | [FontAwesome](https://fontawesome.com/) |
| LZ-string | Compression | 1.4.4 | [Pieroxy](https://github.com/pieroxy/lz-string/) |

### Data Structure
Filter editor imports and exports a `.json` file with a structure matches the one used by the game. The following keys are omitted from exports since modifying them could affect other loaded filters: `"active"` and `"favorite"`.

Here's the example filter structure with common values explained:
```jsonc
{
  "default_show_items": true,
  "name": "My Filter",
  "rules": [
    {
      "active": true,
      "show_item": true,
      // Item quality value decides the rarity of the item e.g. Normal, Magic, Unique, Honorific, etc.. Default is "-1" which matches any rarity
      "item_quality": -1,
      // Ethereal has 3 states:
      // 0 - Either (default value), 1 - Yes, 2 - No
      "ethereal": 0,
      // Clvl has a range of 0 - 150
      "min_clvl": 0,
      "max_clvl": 0,
      // Ilvl has a range of 0 - 150
      "min_ilvl": 0,
      "max_ilvl": 0,
      // Rule type decides what value should be stored inside the "params". Here's the mappings with example values:
      // | rule_type |         params        |
      // |-----------|-----------------------|
      // |    -1     |          null         |
      // |     0     |    { "class": 10 }    |
      // |     1     | { "code": 540291698 } |
      "rule_type": 1,
      "params": { "code": 540291698 },
      "notify": true,
      "automap": true
    }
  ]
}
```

## `generate_items.py` - Item Data Processor
Script is used to transform data coming from `.tsv` files into a `.json` file with a structure expected by the app

### Key Features:
 - Cleans item names (removes color codes, unused items)
 - Converts hex codes to little-endian decimals used by the in-game filters
 - Applies manual overrides from `overrides.json`
 - Maps item categories to more user friendly ones

### Usage
  1. Place input files in same directory as the script
  2. Run: `python generate_items.py`
  3. Output saves to `../itemCode.json`

### Input files
| Name | Source | Description |
|------|--------|-------------|
| items.tsv | MedianXLOfflineTools | Base items/uniques |
| socketables.tsv | MedianXLOfflineTools | Runes/jewels |
| overrides.json | Manual | Custom name/category mappings and ignore list |

### Overrides Guide
- **ignored_hex_codes**: Skips items from the output file (e.g., `"r00": "El Rune"` hides El Runes from item dropdown)
- **name_overrides**: Allows to change in-game item names to more specific ones (e.g., `"cy01": "Small Cycle (Strength)"`)
- **category_overrides**: Forces custom categories (e.g., `"xyz": ["#Charm"]`)
- **item_categories**: Allows to group types into gategory (e.g. `"gem1": "#Gem", "gem2": "#Gem"`)

```jsonc
{
  // Value "name" is only used here to easy determine which item will be hidden
  "ignored_hex_codes": {
    "hex": "name"
  },
  "name_overrides": {
    "hex": "new name"
  },
  "category_overrides": {
    "hex": [],
    "hex": ["type"],
    "hex": ["type", "type"],
  },
  "item_categories": {
    "type": "category"
  }
}
```

### Output Example
```jsonc
[
  {
    "name": "Ist Rune (24)",
    "value": 540291698,
    "hex": "r24",
    "category": ["#Rune"]
  }
]
```
