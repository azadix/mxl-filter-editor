import { clampLvlValues, sanitizeFilterName } from './utils.js';

export class TableManager {
    constructor(ruleManager, storageManager, toastManager, dropdownManager) {
        this.ruleManager = ruleManager;
        this.storageManager = storageManager;
        this.toastManager = toastManager;
        this.dropdownManager = dropdownManager;
        this.table = new DataTable('#rulesTable', {
            autoWidth: true,
            paging: false,
            compact: true,
            order: [],
            fixedHeader: true,
            targets: 'no-sort',
            scrollY: 625,
            scrollCollapse: false,
            columnDefs: [{ visible: false, targets: 0 }],
            layout: {
                topStart: () => this.createAddRuleButton(),
                topEnd: '',
                bottomStart: { info: { empty: '', text: 'Rule count: _TOTAL_' } }
            }
        });

        this.initializeGlobalSelectors();
        this.initializeEventListeners();
        this.initializeSortable();
    }

    initializeSortable() {
        const tableBody = document.querySelector('#rulesTable tbody');

        Sortable.create(tableBody, {
            handle: '.handle',
            animation: 150,
            onEnd: (event) => {
                const rows = Array.from(tableBody.querySelectorAll('tr'));
                const newOrder = rows.map(row => row.dataset.index);

                this.ruleManager.reorderRules(newOrder);
                this.renderTable();
            }
        });
    }

    createAddRuleButton() {
        const addRuleButton = document.createElement('button');
        addRuleButton.classList.add("button", "is-success", "is-outlined", "is-inverted");
        addRuleButton.innerHTML = '<span class="icon is-small"><i class="fas fa-plus"></i></span><span>Add new rule</span>';

        addRuleButton.addEventListener("click", () => {
            this.ruleManager.addRule();
            this.renderTable();
        });

        return addRuleButton;
    }

    renderTable() {
        this.table.rows().nodes().to$().off('*');
        this.table.clear();
        this.dropdownManager.destroySelect();

        this.ruleManager.getRules().forEach((rule, index) => {
            const rowData = this.createRowData(rule, index);
            this.table.row.add(rowData).node();
        });
        this.table.draw();
        this.table.columns.adjust();
    }

    initializeGlobalSelectors() {
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'globalSelectorModal';
        modal.classList.add('modal');
        modal.innerHTML = `
            <div class="modal-background"></div>
            <div class="modal-content" style="height: 50%;">
                <select id="globalSelector" style="width: 100%;"></select>
            </div>
            <button class="modal-close is-large" aria-label="close"></button>
        `;
        document.body.appendChild(modal);
    
        // Initialize Select2
        this.globalSelector = $('#globalSelector').select2({
            dropdownParent: $('#globalSelectorModal .modal-content'),
            width: '100%',
            placeholder: 'Select an option',
            allowClear: false,
        });
    
        // Close modal on background or close button click
        $(modal).find('.modal-background, .modal-close').on('click', () => this.closeGlobalSelectorModal());
    }

    openGlobalSelectorModal(ruleType, currentValue, onChangeCallback) {
        // Populate Select2 options based on ruleType
        const options = ruleType === 1
            ? this.ruleManager.getItemCodes()
            : this.ruleManager.getItemClasses();
    
        const select2Data = options.map(option => ({
            id: option.value,
            text: option.name
        }));
    
        // Clear and populate the global selector
        this.globalSelector.empty().select2({
            data: select2Data,
            dropdownParent: $('#globalSelectorModal .modal-content'),
            width: '100%',
            height: '100%',
            placeholder: 'Select an option',
            allowClear: false,
        });
    
        // Set the current value
        this.globalSelector.val(currentValue);

        // Handle value change
        this.globalSelector.off('change').on('change', function () {
            const newValue = $(this).val();
            onChangeCallback(newValue);
        });
    
        // Show modal
        document.getElementById('globalSelectorModal').classList.add('is-active');
        this.globalSelector.select2('open');
        $('#globalSelector').next('.select2-container').find('.select2-selection--single').remove();
    }

    closeGlobalSelectorModal() {
        document.getElementById('globalSelectorModal').classList.remove('is-active');
    }

    createRowData(rule, index) {
        return [
            rule.id | Date.now(),
            `<span class="handle icon is-normal"><i class="fas fa-arrows-alt-v"></i></span>`,
            `<div class="checkbox-container"><input id="active" class="checkbox-input rule-is-active" type="checkbox" ${rule.active ? 'checked' : ''}></div>`,
            `<div class="select">
                <select class="rule-is-shown ${this.getShowClassName(index)}">
                    <option class="has-text-success" value="1" ${rule.show_item == "1" ? 'selected' : ''}>Show</option>
                    <option class="has-text-danger" value="0" ${rule.show_item == "0" ? 'selected' : ''}>Hide</option>
                </select>
            </div>`,
            `<div class="select">
                <select class="rule-is-eth">
                    ${this.getEtherealStateOptions(rule)}
                </select>
            </div>`,
            `<div class="select">
                <select class="rule-quality ${this.getQualityClassName(index)}">
                    ${this.ruleManager.getItemQuality().map(quality => `
                        <option class="${quality.class}" value="${quality.value}" ${rule.item_quality === quality.value ? 'selected' : ''}>
                            ${quality.name}
                        </option>
                    `).join("")}
                </select>
            </div>`,
            this.createOptionParams(rule.rule_type, index),
            `<div class="input-wrapper">
                <div><input class="input form-group-input rule-min-clvl" placeholder="0" id="min_clvl" type="number" value="${rule.min_clvl}"></div>
                <div><input class="input form-group-input rule-max-clvl" placeholder="0" id="max_clvl" type="number" value="${rule.max_clvl}"></div>
            </div>`,
            `<div class="input-wrapper">
                <div><input class="input form-group-input rule-min-ilvl" placeholder="0" id="min_ilvl" type="number" value="${rule.min_ilvl}"></div>
                <div><input class="input form-group-input rule-max-ilvl" placeholder="0" id="max_ilvl" type="number" value="${rule.max_ilvl}"></div>
            </div>`,
            `<div class="checkbox-container"><input id="notify" class="checkbox-input rule-is-notify" type="checkbox" ${rule.notify ? 'checked' : ''}></div>`,
            `<div class="checkbox-container"><input id="automap" class="checkbox-input rule-is-automap" type="checkbox" ${rule.automap ? 'checked' : ''}></div>`,
            `<div class="checkbox-container"><a class="button is-danger is-outlined delete-rule"><i class="fas fa-trash pr-1"></i></a></div>`
        ];
    }

    getShowClassName(index) {
        const rule = this.ruleManager.getRules()[index];
        return rule.show_item ? "has-text-success" : "has-text-danger";
    }

    getEtherealStateOptions(rule) {
        const etherealStates = this.ruleManager.getEtherealStates();
        return Object.entries(etherealStates).map(([key, value]) => `
            <option value="${value}" ${rule.ethereal === value ? 'selected' : ''}>${key}</option>`).join("");
    }

    getQualityClassName(index) {
        return this.ruleManager.getItemQuality().find(quality => quality.value === Number(this.ruleManager.getRules()[index].item_quality)).class;
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

    createOptionParams(ruleType, jsonIndex) {
        const rule = this.ruleManager.getRules()[jsonIndex];
        const groupWrapper = document.createElement('div');
        const paramsWrapper = document.createElement('div');
        const paramsDatalist = document.createElement('select');

        paramsWrapper.classList.add("select", "width-100");
        paramsDatalist.classList.add("rule-param-value", "width-100");

        groupWrapper.appendChild(this.createParamsDropdown(ruleType));
        groupWrapper.appendChild(paramsWrapper);
        groupWrapper.classList.add("input-wrapper", "min-width-500");

        const option = document.createElement("option");
        option.hidden = true;

        switch (Number(ruleType)) {
            case 1: // Items
                if (rule.params?.code === undefined) {
                    rule.params = { code: 0 };
                }

                option.value = rule.params?.code;
                option.text = this.ruleManager.getItemCodes().find(item => item.value === rule.params.code)?.name || "";
                paramsDatalist.appendChild(option);

                if (rule.params?.code !== undefined) {
                    paramsDatalist.value = rule.params.code;
                }

                paramsWrapper.appendChild(paramsDatalist);
                break;

            case 0: // Class
                if (rule.params?.class === undefined) {
                    rule.params = { class: 0 };
                }

                option.value = rule.params?.class;
                option.text = this.ruleManager.getItemClasses().find(item => item.value === rule.params.class)?.name || "";
                paramsDatalist.appendChild(option);

                if (rule.params?.class !== undefined) {
                    paramsDatalist.value = rule.params.class;
                }

                paramsWrapper.appendChild(paramsDatalist);
                break;
            default:
                paramsWrapper.classList.remove("width-100");
                break;
        }

        return groupWrapper;
    }

    createParamsDropdown(ruleType) {
        const outerWrapper = document.createElement('div');
        const selectParams = document.createElement('select');
        outerWrapper.classList.add("select");
        selectParams.classList.add("rule-param-type");

        Object.entries(this.ruleManager.getRuleTypes()).forEach(([key, value]) => {
            const option = document.createElement("option");
            option.value = value;
            option.text = key;
            selectParams.appendChild(option);
        });

        selectParams.value = ruleType;
        outerWrapper.appendChild(selectParams);
        return outerWrapper;
    }

    initializeEventListeners() {
        const defaultNotify = localStorage.getItem('defaultNotify') === 'true';
        const defaultMap = localStorage.getItem('defaultMap') === 'true';

        $('#defaultNotify').prop('checked', defaultNotify);
        $('#defaultMap').prop('checked', defaultMap);

        // Handle changes to defaultNotify
        $('#defaultNotify').on('change', function () {
            const isChecked = $(this).is(':checked');
            localStorage.setItem('defaultNotify', isChecked);
        });

        // Handle changes to defaultMap
        $('#defaultMap').on('change', function () {
            const isChecked = $(this).is(':checked');
            localStorage.setItem('defaultMap', isChecked);
        });

        // Open the settings modal
        $('#filterSettings').on('click', function () {
            $('#settingsModal').addClass('is-active');
        });

        // Close the modal when clicking the background
        $('#settingsModal .modal-background').on('click', function () {
            $('#settingsModal').removeClass('is-active');
        });

        // Close the modal when clicking the Cancel button
        $('#settingsModal .modal-card-foot .button:not(.is-success)').on('click', function () {
            $('#settingsModal').removeClass('is-active');
        });

        // Handle Save changes in the modal
        $('#settingsModal .modal-card-foot .is-success').on('click', () => {
            this.toastManager.showToast("Preferences saved!", true); // Use toastManager to show a toast
            $('#settingsModal').removeClass('is-active');
        });

        // Paste from clipboard
        $('#pasteFromClipboard').on('click', () => {
            try {
                const text = prompt("Please paste the JSON data here:");
                if (!text) {
                    this.toastManager.showToast("No data pasted.", true);
                    return;
                }

                const data = JSON.parse(text);
                if (data && typeof data === "object" && data.rules) {
                    $('#defaultShowItems').prop('checked', data.default_show_items);
                    $('#filterName').val(data.name);

                    this.ruleManager.clearRules();
                    data.rules.reverse().forEach(rule => this.ruleManager.addRule(rule));
                    this.renderTable();
                } else {
                    this.toastManager.showToast("Invalid JSON format.");
                }
            } catch (error) {
                this.toastManager.showToast("Failed to paste: " + error);
            }
        });

        // Copy to clipboard
        $('#copyToClipboard').on('click', () => {
            const filterName = $('#filterName').val().trim();
            const output = this.generateOutput();

            navigator.clipboard.writeText(output)
                .then(() => this.toastManager.showToast(`Filter "${filterName}" copied to clipboard!`, true))
                .catch(err => this.toastManager.showToast("Failed to copy: " + err));
        });

        // Save to localStorage
        $('#saveToLocalStorage').on('click', () => {
            const filterName = $('#filterName').val().trim();
            if (!filterName) {
                this.toastManager.showToast("Please enter a filter name before saving.");
                return;
            }

            const cleanedFilterName = sanitizeFilterName(filterName);
            const filterData = this.generateOutput();

            this.storageManager.saveFilter(cleanedFilterName, filterData);
            this.toastManager.showToast(`Filter "${cleanedFilterName}" saved to local storage!`, true);
            this.dropdownManager.updateFilterSelect();
        });

        // Load from localStorage
        $('#loadFromLocalStorage').on('change', () => {
            const filterName = $('#loadFromLocalStorage').val();
            if (!filterName) {
                return;
            }

            const filterData = this.storageManager.loadFilter(filterName);
            if (filterData) {
                $('#defaultNotify').prop('checked', filterData.default_notify);
                $('#defaultMap').prop('checked', filterData.default_map);
                $('#defaultShowItems').prop('checked', filterData.default_show_items);
                $('#filterName').val(filterData.name);

                this.ruleManager.clearRules();
                filterData.rules.reverse().forEach(rule => this.ruleManager.addRule(rule));
                this.renderTable();

                this.toastManager.showToast(`Filter "${filterName}" loaded successfully!`, true);
            } else {
                this.toastManager.showToast(`Filter "${filterName}" not found in local storage.`, true);
            }
        });

        // Delete from localStorage
        $('#deleteFromLocalStorage').on('click', () => {
            const filterName = $('#filterName').val().trim();
            if (!filterName) {
                this.toastManager.showToast("Please select a filter to delete.", true);
                return;
            }
            const confirmDelete = confirm("Are you sure you want to delete this filter from storage?");
            
            if (confirmDelete) {
                if (this.storageManager.deleteFilter(filterName)) {
                    this.toastManager.showToast(`Filter "${filterName}" deleted from local storage!`, true);
                    this.dropdownManager.updateFilterSelect();
                } else {
                    this.toastManager.showToast(`Filter "${filterName}" not found in local storage.`, true);
                }
            }
            
        });

        $('#newFilter').on('click', () => {
            const confirmReset = confirm("Are you sure you want to create a new filter? This will clear all current rules and reset the filter.");

            if (confirmReset) {
                this.ruleManager.clearRules();
                $('#defaultShowItems').prop('checked', true);
                $('#filterName').val('');
                $('#loadFromLocalStorage').val('');
                $('#loadFromLocalStorage option[value=""]').prop('selected', true);
    
                this.renderTable();
            }
        });

        // Table event listeners
        this.table.on('change', '.rule-is-active', (event) => {
            const paramValue = $(event.target).is(":checked");
            const dataIndex = $(event.target).closest('tr').data('index');

            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { active: paramValue });

                const updatedRowData = this.createRowData(this.ruleManager.getRules()[dataIndex], dataIndex);
                this.updateTableRow(dataIndex, updatedRowData);
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-is-shown', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
        
            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { show_item: paramValue == "1" })
        
                $(event.target).removeClass("has-text-success has-text-danger").addClass(this.getShowClassName(dataIndex));
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-quality', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
        
            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { item_quality: Number(paramValue) })

                $(event.target).removeClass(this.ruleManager.getItemQuality().map(quality => quality.class).join(" "));
                $(event.target).addClass(this.getQualityClassName(dataIndex));
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-is-eth', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
    
            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { ethereal: Number(paramValue) })
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-param-type', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
        
            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { rule_type: Number(paramValue) })
        
                // Re-initialize params based on the new rule_type
                switch (paramValue) {
                    case "-1": // None
                        this.ruleManager.updateRule(dataIndex, { params: null });
                        break;
                    case "0": // Class
                        this.ruleManager.updateRule(dataIndex, { params: { class: 0 } });
                        break;
                    case "1": // Item
                        this.ruleManager.updateRule(dataIndex, { params: { code: 0 } });
                        break;
                }
        
                const updatedRowData = this.createRowData(this.ruleManager.getRules()[dataIndex], dataIndex);
                this.updateTableRow(dataIndex, updatedRowData);
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('click', '.rule-param-value', (event) => {
            const dataIndex = $(event.target).closest('tr').data('index');
            const rule = this.ruleManager.getRules()[dataIndex];  
            const currentValue = rule.rule_type === 1 ? rule.params?.code : rule.params?.class;

            this.openGlobalSelectorModal(rule.rule_type, currentValue, (newValue) => {
                if (rule.rule_type === 0) { // Class
                    this.ruleManager.updateRule(dataIndex, { params: { class: Number(newValue) } });
                } else if (rule.rule_type === 1) { // Item
                    this.ruleManager.updateRule(dataIndex, { params: { code: Number(newValue) } });
                } else {
                    console.warn('Invalid rule type:', rule.rule_type);
                }
                
                // Update the parent dropdown with the new value
                const parentDropdown = $(event.target).closest('tr').find('.rule-param-value');
                parentDropdown.val(newValue).trigger('change');

                const updatedRowData = this.createRowData(this.ruleManager.getRules()[dataIndex], dataIndex);
                this.updateTableRow(dataIndex, updatedRowData);
                this.closeGlobalSelectorModal();
            });
        });
        this.table.on('change', '.rule-min-clvl', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
            const clampedValue = clampLvlValues(paramValue);
            $(event.target).val(clampedValue);

            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { min_clvl: clampedValue });
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-max-clvl', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
            const clampedValue = clampLvlValues(paramValue);
            $(event.target).val(clampedValue);
            
            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { max_clvl: clampedValue });
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-min-ilvl', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
            const clampedValue = clampLvlValues(paramValue);
            $(event.target).val(clampedValue);
            
            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { min_ilvl: clampedValue });
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-max-ilvl', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
            const clampedValue = clampLvlValues(paramValue);
            $(event.target).val(clampedValue);
            
            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { max_ilvl: clampedValue });
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-is-notify', (event) => {
            const paramValue = $(event.target).is(":checked");
            const dataIndex =  $(event.target).closest('tr').data('index');
            
            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { notify: paramValue });
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-is-automap', (event) => {
            const paramValue = $(event.target).is(":checked");
            const dataIndex =  $(event.target).closest('tr').data('index');
            
            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { automap: paramValue });
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('draw', (event) => {
            this.table.rows().every(function (rowIdx) {
                const rowNode = this.node();
                rowNode.dataset.index = rowIdx;
            });
        });
        this.table.on('click', '.delete-rule', (event) => {
            const dataIndex = $(event.target).closest('tr').data('index');
            
            if (dataIndex !== undefined && dataIndex < this.ruleManager.getRules().length) {
                this.ruleManager.deleteRule(dataIndex);
                this.table.row($(event.target).closest('tr')).remove().draw(false);
                //this.renderTable();
            } else {
                console.warn("Invalid index or index out of bounds.");
            }
        });
    }

    generateOutput() {
        const filterName = $('#filterName').val().trim();
        const rules = this.ruleManager.getRules();

        return JSON.stringify({
            default_show_items: $('#defaultShowItems').is(":checked"),
            name: filterName || `UnnamedFilter${Date.now().toString()}`,
            rules: rules.map(rule => {
                // Exclude the `id` property from the output
                const { id, ...cleanedRule } = rule;
                return cleanedRule;
            })
        }, null, 2);
    }
}