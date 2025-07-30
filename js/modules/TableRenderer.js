import { 
    ruleManager
} from '../globals.js';

import { DropdownList } from './DropdownList.js';
export class TableRenderer {
    constructor(table) {
        this.table = table;
    }

    async render() {
        this.table.rows().nodes().to$().off('*');
        this.table.clear();
        const rules = ruleManager.getRules();

        if (rules.length === 0) {
            $('.dt-layout-table').hide();
        } else {
            $('.dt-layout-table').show();
        }

        // Create all row data first
        const rowDataPromises = rules.map((rule, index) => 
            this.createRowData(rule, index)
        );
        
        // Wait for all row data to be ready
        const allRowData = await Promise.all(rowDataPromises);
        
        // Add rows to table
        allRowData.forEach(rowData => {
            this.table.row.add(rowData).node();
        });
        
        this.table.draw();
        this.table.columns.adjust();
    }

    getShowClassName(index) {
        const rule = ruleManager.getRules()[index];
        return rule.show_item ? "has-text-success" : "has-text-danger";
    }

    createEtherealStateOptions(rule) {
        return Object.values(ruleManager.etherealStates).map(state => `
            <option value="${state.value}" ${rule.ethereal === state.value ? 'selected' : ''}>
                ${state.name}
            </option>`).join("");
    }

    getQualityClassName(index) {
        return ruleManager.getItemQuality().find(quality => quality.value === Number(ruleManager.getRules()[index].item_quality)).class;
    }

    updateTableRow(rowIndex, rowData) {
        const rowNode = this.table.row(rowIndex).node();
        if (rowNode) {
            this.table.row(rowIndex).data(rowData).draw(false);
            rowNode.dataset.index = rowIndex;
        } else {
            console.warn(`Row with index ${rowIndex} not found.`);
        }
    }

    async createOptionParams(jsonIndex) {
        const rule = ruleManager.getRules()[jsonIndex];
        const wrapper = document.createElement('div');
        wrapper.classList.add("field");

        const selectElement = document.createElement('select');
        selectElement.id = `param-value-${jsonIndex}`;
        selectElement.style.display = 'none';
        wrapper.appendChild(selectElement);

        const dropdown = new DropdownList(selectElement, {
            placeholder: 'Type to search...',
            searchable: true,
            template: (item) => {
                if (!item) return '<div>No item</div>';
                return `
                    <div class="is-flex">
                        <span>${item.name || 'Unknown'}</span>
                    </div>`;
            }
        });

        const loadItems = async () => {
            // Get sorted data from manager
            const itemClasses = ruleManager.getItemClasses();
            const itemCodes = ruleManager.getItemCodes();
            
            // Convert to array format that dropdown expects
            const classOptions = Object.entries(itemClasses).map(([value, name]) => ({
                value: parseInt(value),
                name: name,
                type: 'class'
            }));

            const itemOptions = Object.entries(itemCodes).map(([value, name]) => ({
                value: parseInt(value),
                name: name,
                type: 'item'
            }));
            
            // Combine and maintain sort order
            return [...classOptions, ...itemOptions];
        };

        // Load initial items
        const initialItems = await loadItems();
        dropdown.setItems(initialItems);

        // Set current value if exists
        if (rule.params?.code !== undefined) {
            const currentValue = initialItems.find(i => i.value === rule.params.code);
            if (currentValue) {
                dropdown.value = currentValue.value;
                dropdown.input.value = currentValue.name;
            }
        } else if (rule.params?.class !== undefined) {
            const currentValue = initialItems.find(i => i.value === rule.params.class);
            if (currentValue) {
                dropdown.value = currentValue.value;
                dropdown.input.value = currentValue.name;
            }
        }

        // Handle input clearing
        dropdown.input.addEventListener('input', (e) => {
            if (e.target.value === '') {
                // Clear the selection
                dropdown.value = null;
                dropdown.selectedItem = null;
                // Reset to show all items
                dropdown.renderItems(initialItems);
                // Update the rule
                ruleManager.updateRule(jsonIndex, {
                    rule_type: -1,
                    params: null
                });
            }
        });

        // Handle selection changes
        selectElement.addEventListener('change', (e) => {
            if (!e.detail || !e.detail.value) {
                ruleManager.updateRule(jsonIndex, {
                    rule_type: -1,
                    params: null
                });
                return;
            }

            const selectedValue = parseInt(e.detail.value);
            const selectedItem = dropdown.items.find(item => item.value === selectedValue);
            
            if (selectedItem) {
                const newRuleType = selectedItem.type === 'item' 
                    ? ruleManager.ruleTypes.ITEM.value 
                    : ruleManager.ruleTypes.CLASS.value;
                
                ruleManager.updateRule(jsonIndex, {
                    rule_type: newRuleType,
                    params: selectedItem.type === 'item' 
                        ? { code: selectedItem.value } 
                        : { class: selectedItem.value }
                });
                
                // Update the dropdown items
                loadItems().then(items => {
                    dropdown.setItems(items);
                });
            }
        });

        return wrapper;
    }

    updateRowIndexes() {
        const rows = this.table.rows().nodes();
        
        $(rows).each((index, rowNode) => {
            $(rowNode).attr('data-index', index);
        });
    }

    async createRowData(rule, index) {
        const optionParams = await this.createOptionParams(index);
        
        return [
            rule.id || Date.now(),
            `<span class="handle icon is-normal"><i class="fas fa-arrows-alt-v"></i></span>`,
            `<div class="checkbox-container"><input id="active-${index}" class="checkbox-input rule-is-active" type="checkbox" ${rule.active ? 'checked' : ''}></div>`,
            `<div class="select">
                <select id="show-${index}" class="rule-is-shown ${this.getShowClassName(index)}">
                    <option class="has-text-success" value="1" ${rule.show_item == "1" ? 'selected' : ''}>Show</option>
                    <option class="has-text-danger" value="0" ${rule.show_item == "0" ? 'selected' : ''}>Hide</option>
                </select>
            </div>`,
            `<div class="select">
                <select id="ethereal-${index}" class="rule-is-eth">
                    ${this.createEtherealStateOptions(rule)}
                </select>
            </div>`,
            `<div class="select">
                <select id="quality-${index}" class="rule-quality ${this.getQualityClassName(index)}">
                    ${ruleManager.getItemQuality().map(quality => `
                        <option class="${quality.class}" value="${quality.value}" ${rule.item_quality === quality.value ? 'selected' : ''}>
                            ${quality.name}
                        </option>
                    `).join("")}
                </select>
            </div>`,
            optionParams,
            `<div class="input-wrapper">
                <div><input class="input form-group-input rule-min-clvl" placeholder="0" id="min_clvl-${index}" type="number" value="${rule.min_clvl}"></div>
                <div><input class="input form-group-input rule-max-clvl" placeholder="0" id="max_clvl-${index}" type="number" value="${rule.max_clvl}"></div>
            </div>`,
            `<div class="input-wrapper">
                <div><input class="input form-group-input rule-min-ilvl" placeholder="0" id="min_ilvl-${index}" type="number" value="${rule.min_ilvl}"></div>
                <div><input class="input form-group-input rule-max-ilvl" placeholder="0" id="max_ilvl-${index}" type="number" value="${rule.max_ilvl}"></div>
            </div>`,
            `<div class="checkbox-container"><input id="notify-${index}" class="checkbox-input rule-is-notify" type="checkbox" ${rule.notify ? 'checked' : ''}></div>`,
            `<div class="checkbox-container"><input id="automap-${index}" class="checkbox-input rule-is-automap" type="checkbox" ${rule.automap ? 'checked' : ''}></div>`,
            `<div class="checkbox-container"><a class="button is-danger is-outlined delete-rule"><span class="icon"><i class="fas fa-trash"></i></span></a></div>`
        ];
    }

    formatItem = (value) => {
        if (!value?.id) {
            return value?.name || '';
        }
        return $(`<span class="is-flex is-fullwidth">${value.name}</span>`);
    }
}