import { sanitizeFilterName } from './utils.js';
export class RuleManager {
    constructor() {
        this.rules = [];
        this.itemCodes = []; // Loaded from JSON
        this.itemClasses = []; // Loaded from JSON
        this.itemQuality = []; // Loaded from JSON
        this.itemNameOverrides = []; // Loaded from JSON
        this.itemHideList = []; // Loaded from JSON

        this.ruleTypes = Object.freeze({
            NONE: { value: -1, name: 'None' },
            CLASS: { value: 0, name: 'Class' },
            ITEM: { value: 1, name: 'Item' }
        });

        this.etherealStates = Object.freeze({
            EITHER: { value: 0, name: 'Either' },
            YES: { value: 1, name: 'Yes' },
            NO: { value: 2, name: 'No' }
        });

        this.ruleTemplate = Object.freeze({
            id: Date.now(),
            active: true,
            automap: true,
            ethereal: 0,
            item_quality: -1,
            max_clvl: 0,
            max_ilvl: 0,
            min_clvl: 0,
            min_ilvl: 0,
            notify: true,
            params: null,
            rule_type: -1,
            show_item: true
        });
    }

    getRuleTypeName(value) {
        return Object.values(this.ruleTypes)
            .find(type => type.value === value)?.name || 'Unknown';
    }

    getEtherealStateName(value) {
        return Object.values(this.etherealStates)
            .find(type => type.value === value)?.name || 'Unknown';
    }

    addRule(rule) {
        let newRule;
        if (rule) {
            newRule = rule;
        } else {
            newRule = { ...this.ruleTemplate };
            newRule.id = Date.now();
            newRule.notify = $('#defaultNotify').is(':checked');
            newRule.automap = $('#defaultMap').is(':checked');
        }
        
        this.rules.unshift(newRule);
        return newRule;
    }

    deleteRule(index) {
        if (index >= 0 && index < this.rules.length) {
            this.rules.splice(index, 1);
        }
    }

    updateRule(index, updates) {
        if (index >= 0 && index < this.rules.length) {
            this.rules[index] = { ...this.rules[index], ...updates };
        }
    }

    reorderRules(newOrder) {
        const reorderedRules = newOrder.map(index => this.rules[index]);
        this.rules = reorderedRules;
    }

    getRules() {
        return this.rules;
    }

    clearRules() {
        this.rules = [];
    }

    getItemCodes() {
        return this.itemCodes;
    }

    getItemClasses() {
        return this.itemClasses;
    }

    getItemQuality() {
        return this.itemQuality;
    }

    getItemNameOverrides() {
        return this.itemNameOverrides;
    }

    getItemHideList() {
        return this.itemHideList;
    }

    processItems() {
        if (!Array.isArray(this.itemCodes)) {
            console.warn('itemCodes must be an array');
            return;
        }

        // Process name overrides first
        let processedItems = this.itemCodes.map(itemArray => {
            if (!Array.isArray(itemArray)) {
                console.warn('Invalid item format, expected array:', itemArray);
                return itemArray; // Return as-is if invalid format
            }

            const [value, name] = itemArray;
            const itemKey = value?.toString();
            
            // Apply name override if exists
            return [
                value, 
                (itemKey && this.itemNameOverrides?.[itemKey]) || name || ''
            ];
        });

        // Apply hide list filter if checkbox is checked
        if (localStorage.getItem("defaultUnobtainableFilter") === "true" && this.itemHideList) {
            processedItems = processedItems.filter(itemArray => {
                if (!Array.isArray(itemArray)) return true; // Keep invalid items
                const [value] = itemArray;
                const itemKey = value?.toString();
                return !(itemKey && this.itemHideList[itemKey]);
            });
        }

        this.itemCodes = processedItems;
    }

    // Reload items data from original source and apply current filter settings
    async reloadItemsData() {
        // We need to reload from the original JSON data
        // This is a simplified approach - in a real app you'd want to cache the original data
        try {
            const response = await fetch('./data/items.json');
            const originalData = await response.json();
            
            // Convert to array format and apply name overrides
            let processedItems = Object.entries(originalData).map(([value, name]) => [
                parseInt(value),
                name
            ]);
            
            // Apply name overrides
            processedItems = processedItems.map(itemArray => {
                const [value, name] = itemArray;
                const itemKey = value?.toString();
                return [
                    value, 
                    (itemKey && this.itemNameOverrides?.[itemKey]) || name || ''
                ];
            });
            
            // Apply hide list filter if enabled
            if (localStorage.getItem("defaultUnobtainableFilter") === "true" && this.itemHideList) {
                processedItems = processedItems.filter(itemArray => {
                    const [value] = itemArray;
                    const itemKey = value?.toString();
                    return !(itemKey && this.itemHideList[itemKey]);
                });
            }
            
            this.itemCodes = processedItems;
        } catch (error) {
            console.error('Failed to reload items data:', error);
        }
    }

    getRuleTypes() {
        return {
            "None": this.ruleTypes.NONE.value,
            "Class": this.ruleTypes.CLASS.value, 
            "Item": this.ruleTypes.ITEM.value
        };
    }

    getEtherealStates() {
        return {
            "Either": this.etherealStates.EITHER.value,
            "Yes": this.etherealStates.YES.value,
            "No": this.etherealStates.NO.value
        };
    }

    loadItemCodes(itemCodes) {
        // Convert object to array if needed
        this.itemCodes = Array.isArray(itemCodes) 
            ? itemCodes 
            : Object.entries(itemCodes).map(([value, name]) => ({
                value,
                name,
                type: 'item'
            }));
    }

    loadItemClasses(itemClasses) {
        // Convert object to array if needed
        this.itemClasses = Array.isArray(itemClasses)
            ? itemClasses
            : Object.entries(itemClasses).map(([value, name]) => ({
                value,
                name,
                type: 'class'
            }));
    }

    loadItemQuality(itemQuality) {
        this.itemQuality = itemQuality;
    }

    loadItemNameOverrides(itemNameOverrides) {
        this.itemNameOverrides = itemNameOverrides;
    }

    loadItemHideList(itemHideList) {
        this.itemHideList = itemHideList;
    }

    isDataLoaded() {
        return (
            (typeof this.itemCodes === 'object' && this.itemCodes !== null && Object.keys(this.itemCodes).length > 0) &&
            (typeof this.itemClasses === 'object' && this.itemClasses !== null && Object.keys(this.itemClasses).length > 0) &&
            Array.isArray(this.itemQuality) && this.itemQuality.length > 0
        );
    }

    generateOutput() {
        const filterName = $('#filterName').val().trim();
        const rules = this.getRules();

        return JSON.stringify({
            default_show_items: $('#defaultShowItems').is(":checked"),
            name: sanitizeFilterName(filterName) || `UnnamedFilter${Date.now().toString()}`,
            rules: rules.map(rule => {
                // Exclude the `id` property from the output
                const { id, ...cleanedRule } = rule;
                return cleanedRule;
            })
        }, null, 2);
    }
}