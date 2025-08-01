# Median XL Filter Editor

<img src="assets/logo.png" width="256" height="256">

A web-based tool for creating and editing item filters for Median XL (an overhaul mod for Diablo 2). This editor provides an enhanced interface for the in-game filter editor.

**Current MedianXL version data:** MXL 2.11.1

## Features

### Enhanced Filter Management
- Save filters in browser's local storage
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
Median XL item and class data is sourced from the Not Armory website, provided by Aahz.

| Asset name | Source | Link | Description |
|------------|--------|------|-------------|
| items.json | Not Armory | [`items.json`](https://tsw.vn.cz/filters/item.json) | Contains item codes |
| item_classes.json | Not Armory | [`item_classes.json`](https://tsw.vn.cz/filters/item_classes.json) | Contains item classes |
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

### Overrides Guide
The following files allow for overriding full item data:

- **item_hide_list**: Hides specific items from item dropdown e.g., `"540094578": "El Rune"`
- **item_name_overrides**: Allows to change in-game item names to more specific ones e.g., `"825260387": "Small Cycle (Strength)"`

```jsonc
{
  // Value "name" is only used here to easy determine which item will be hidden
  "item_hide_list": {
    "value": "name"
  },
  "item_name_overrides": {
    "value": "new name"
  }
}
```

### Output Example
```jsonc
[
  {
    "540291698": "Ist Rune (24)",
  }
]
```
