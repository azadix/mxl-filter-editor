export class RuleManager {
    constructor() {
        this.rules = [];
        this.itemCodes = []; // Loaded from JSON
        this.itemClasses = []; // Loaded from JSON
        this.itemQuality = []; // Loaded from JSON
        this.ruleTypes = {
            "None": -1,
            "Item": 1,
            "Class": 0
        };
        this.etherealStates = {
            "Either": 0,
            "Yes": 1,
            "No": 2
        };
        this.ruleTemplate = {
            id: Date.now(),
            active: true,
            show_item: true,
            item_quality: -1,
            ethereal: 0,
            min_clvl: 0,
            max_clvl: 0,
            min_ilvl: 0,
            max_ilvl: 0,
            rule_type: -1,
            params: null,
            notify: $('#defaultNotify').is(':checked'),
            automap: $('#defaultMap').is(':checked')
        };
    }

    addRule(rule) {
        let newRule;
        if (rule) {
            newRule = rule;
        } else {
            newRule = JSON.parse(JSON.stringify(this.ruleTemplate));
            newRule.id = Date.now();
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

    getRuleTypes() {
        return this.ruleTypes;
    }

    getEtherealStates() {
        return this.etherealStates;
    }

    loadItemCodes(itemCodes) {
        this.itemCodes = itemCodes;
    }

    loadItemClasses(itemClasses) {
        this.itemClasses = itemClasses;
    }

    loadItemQuality(itemQuality) {
        this.itemQuality = itemQuality;
    }
}