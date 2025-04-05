# Median XL Filter Editor

<img src="assets/logo.png" width="256" height="256">

A web-based tool for creating and editing item filters for Median XL (an overhaul mod for Diablo 2). This editor provides an enhanced interface with more features than the in-game filter editor.

**Current Version Support:** MXL 2.10.3

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
All data is current as of **Median XL version 2.10.2**.

Median XL item data is sourced from the [MedianXLOfflineTools](https://github.com/kambala-decapitator/MedianXLOfflineTools) repository, provided by [@kambala-decapitator](https://github.com/kambala-decapitator):

- **Base Items & Uniques**   [`items.tsv`](https://github.com/kambala-decapitator/MedianXLOfflineTools/blob/main/utils/txt_parser/generated/en/items.tsv)  
  Contains all regular items, uniques, charms and other special items

- **Socketables & Crafting Components**  [`socketables.tsv`](https://github.com/kambala-decapitator/MedianXLOfflineTools/blob/main/utils/txt_parser/generated/en/socketables.tsv)  
  Includes runes, jewels, and other socketable items

### Assets
- **Logo**  
  Generated using OpenAI's ChatGPT (DALL-E)  
  *Last updated: 4th April 2024*

- **Category Icons**   [`MedianXLOfflineTools/images`](https://github.com/kambala-decapitator/MedianXLOfflineTools/tree/main/resources/data/images/items)  
  Category icons based on Median XL in-game art

### Third-Party Libraries
This project uses several open-source libraries:

| Library | Purpose | Link |
|---------|---------|------|
| Bulma CSS | CSS framework | [bulma.io](https://bulma.io/) |
| DataTables | Table interaction | [datatables.net](https://datatables.net/) |
| Select2 | Enhanced select elements | [select2.org](https://select2.org/) |
| SortableJS | Drag-and-drop functionality | [SortableJS](https://sortablejs.github.io/Sortable/) |
| maximize-select2-height | Select2 enhancement | [Panorama Education](https://github.com/panorama-ed/maximize-select2-height) |

### Data Structure
Filters use a JSON structure that matches the game's export format. The following keys are omitted from exports since modifying them could affect other loaded filters: `"active"` and `"favorite"`.

Example JSON structure:
```json
{
  "default_show_items": true,
  "name": "My Filter",
  "rules": [
    {
      "active": true,
      "show_item": true,
      "item_quality": -1,
      "ethereal": 0,
      "min_clvl": 0,
      "max_clvl": 0,
      "min_ilvl": 0,
      "max_ilvl": 0,
      "rule_type": 1,
      "params": { "code": 123 },
      "notify": true,
      "automap": true
    }
  ]
}