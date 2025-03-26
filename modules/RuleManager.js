export class RuleManager {
    constructor() {
        this.rules = [];
        this.itemCodes = []; // Loaded from JSON
        this.itemClasses = []; // Loaded from JSON
        this.itemQuality = []; // Loaded from JSON

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
            notify: true,
            automap: true
        };
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
            newRule = this.ruleTemplate;
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

    getRuleTypes() {
        return {
            "None": this.RuleTypes.NONE.value,
            "Class": this.RuleTypes.CLASS.value, 
            "Item": this.RuleTypes.ITEM.value
        };
    }

    getEtherealStates() {
        return {
            "Either": this.EtherealStates.EITHER.value,
            "Yes": this.EtherealStates.YES.value,
            "No": this.EtherealStates.NO.value
        };
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