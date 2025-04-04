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
      // "rule_type" determines the "params" structure:
      // -1: "params" should be null
      //  0: "params" should contain { "class": value } (filter by category)
      //  1: "params" should contain { "code": value } (filter by specific item)
      "rule_type": 1,
      "params": { "code": 123 },
      "notify": true,
      "automap": true
    }
  ]
}