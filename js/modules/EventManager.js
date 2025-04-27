import { clampLvlValues, sanitizeFilterName } from './utils.js';
import { FilterEncoder } from './FilterEncoder.js';

export class EventManager {
    constructor(table, ruleManager, dropdownManager, toastManager, tableRenderer, storageManager) {
        this.table = table;
        this.ruleManager = ruleManager;
        this.dropdownManager = dropdownManager;
        this.toastManager = toastManager;
        this.tableRenderer = tableRenderer;
        this.storageManager = storageManager;
        this.filterEncoder = new FilterEncoder(this.ruleManager);
    }

    initialize() {
        if (!this.ruleManager.isDataLoaded()) {
            this.toastManager.showToast('Waiting for data to load...', true);
            return;
        }

        const defaultNotify = localStorage.getItem('defaultNotify') === 'true';
        const defaultMap = localStorage.getItem('defaultMap') === 'true';

        $('#defaultNotify').prop('checked', defaultNotify);
        $('#defaultMap').prop('checked', defaultMap);

        // Handle changes to defaultNotify
        $('#defaultNotify').on('change', (event) => {
            const isChecked = $(event.target).is(':checked');
            localStorage.setItem('defaultNotify', isChecked);
        });

        // Handle changes to defaultMap
        $('#defaultMap').on('change', (event) => {
            const isChecked = $(event.target).is(':checked');
            localStorage.setItem('defaultMap', isChecked);
        });

        $('#shareFilter').on('click', () => {
            try {
                const filterData = this.ruleManager.generateOutput();
                const shareLink = this.filterEncoder.generateShortenedLink(JSON.parse(filterData));
                
                if (shareLink) {
                    navigator.clipboard.writeText(shareLink)
                        .then(() => {
                            this.toastManager.showToast('Share link copied', true);
                        })
                        .catch(() => {
                            // Fallback if clipboard API fails
                            prompt('Copy this compact link to share your filter:', shareLink);
                        });
                } else {
                    this.toastManager.showToast('Failed to generate share link', false, 'danger');
                }
            } catch (error) {
                console.error('Error sharing filter:', error);
                this.toastManager.showToast('Error sharing filter', false, 'danger');
            }
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
            this.toastManager.showToast("Preferences saved!", true);
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
                    this.tableRenderer.render();
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
            const output = this.ruleManager.generateOutput();

            navigator.clipboard.writeText(output)
                .then(() => this.toastManager.showToast(`Filter "${filterName}" copied to clipboard!`, true))
                .catch(err => this.toastManager.showToast("Failed to copy: " + err));
        });

        // Save to localStorage
        $('#saveToLocalStorage').on('click', () => {
            const filterName = sanitizeFilterName($('#filterName').val()).trim();
            if (!filterName) {
                this.toastManager.showToast("Please enter a filter name before saving.");
                return;
            }
        
            const filterData = this.ruleManager.generateOutput();
            this.storageManager.saveFilter(filterName, filterData);
            this.toastManager.showToast(`Filter "${filterName}" saved!`, true);
            this.dropdownManager.updateFilterSelect();
        });
        
        // Load from localStorage
        $('#loadFromLocalStorage').on('change', () => {
            const filterName = $('#loadFromLocalStorage').val().trim();
            if (!filterName) return;
        
            const filterData = this.storageManager.loadFilter(filterName);
            if (filterData) {
                const parsedData = JSON.parse(filterData);
                $('#defaultShowItems').prop('checked', parsedData.default_show_items);
                $('#filterName').val(filterName);
        
                this.ruleManager.clearRules();
                parsedData.rules.reverse().forEach(rule => this.ruleManager.addRule(rule));
                this.tableRenderer.render();
        
                this.toastManager.showToast(`Filter "${filterName}" loaded successfully!`, true);
            } else {
                this.toastManager.showToast(`Filter "${filterName}" not found.`, true);
            }
        });
        
        // Delete from localStorage
        $('#deleteFromLocalStorage').on('click', () => {
            const filterName = $('#filterName').val().trim();
            if (!filterName) {
                this.toastManager.showToast("Please select a filter to delete.", true);
                return;
            }
            
            const confirmDelete = confirm(`Are you sure you want to delete "${filterName}"?`);
            if (confirmDelete) {
                if (this.storageManager.deleteFilter(filterName)) {
                    this.toastManager.showToast(`Filter "${filterName}" deleted!`, true);
                    this.dropdownManager.updateFilterSelect();
                    
                    // Reset the UI
                    $('#filterName').val('');
                    $('#loadFromLocalStorage').val('');
                    this.ruleManager.clearRules();
                    this.tableRenderer.render();
                } else {
                    this.toastManager.showToast(`Filter "${filterName}" not found.`, true);
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
    
                this.tableRenderer.render();
            }
        });

        // Table event listeners
        this.table.on('change', '.rule-is-active', (event) => {
            const paramValue = $(event.target).is(":checked");
            const dataIndex = $(event.target).closest('tr').data('index');

            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { active: paramValue });

                const updatedRowData = this.tableRenderer.createRowData(this.ruleManager.getRules()[dataIndex], dataIndex);
                this.tableRenderer.updateTableRow(dataIndex, updatedRowData);
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-is-shown', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
        
            if (dataIndex !== undefined) {
                this.ruleManager.updateRule(dataIndex, { show_item: paramValue == "1" })
        
                $(event.target).removeClass("has-text-success has-text-danger").addClass(this.tableRenderer.getShowClassName(dataIndex));
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
                $(event.target).addClass(this.tableRenderer.getQualityClassName(dataIndex));
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
                this.ruleManager.updateRule(dataIndex, { rule_type: Number(paramValue) });
                
                switch (Number(paramValue)) {
                    case this.ruleManager.ruleTypes.NONE.value:
                        this.ruleManager.updateRule(dataIndex, { params: null });
                        break;
                    case this.ruleManager.ruleTypes.CLASS.value:
                        this.ruleManager.updateRule(dataIndex, { params: { class: 0 } });
                        break;
                    case this.ruleManager.ruleTypes.ITEM.value:
                        this.ruleManager.updateRule(dataIndex, { params: { code: 0 } });
                        break;
                }
                
                const updatedRowData = this.tableRenderer.createRowData(this.ruleManager.getRules()[dataIndex], dataIndex);
                this.tableRenderer.updateTableRow(dataIndex, updatedRowData);
            }
        });
        this.table.on('click', '.rule-param-value', (event) => {
            const dataIndex = $(event.target).closest('tr').data('index');
            const rule = this.ruleManager.getRules()[dataIndex];  
            const currentValue = rule.rule_type === this.ruleManager.ruleTypes.ITEM.value 
                                ? rule.params?.code 
                                : rule.params?.class;

            this.tableRenderer.openGlobalSelectorModal(rule.rule_type, currentValue, (newValue) => {
                if (rule.rule_type === this.ruleManager.ruleTypes.CLASS.value) {
                    this.ruleManager.updateRule(dataIndex, { params: { class: Number(newValue) } });
                } else if (rule.rule_type === this.ruleManager.ruleTypes.ITEM.value) {
                    this.ruleManager.updateRule(dataIndex, { params: { code: Number(newValue) } });
                } else {
                    console.warn('Invalid rule type:', rule.rule_type);
                }
                
                // Update the parent dropdown with the new value
                const parentDropdown = $(event.target).closest('tr').find('.rule-param-value');
                parentDropdown.val(newValue).trigger('change');

                const updatedRowData = this.tableRenderer.createRowData(this.ruleManager.getRules()[dataIndex], dataIndex);
                this.tableRenderer.updateTableRow(dataIndex, updatedRowData);
                this.dropdownManager.closeGlobalSelectorModal();
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
            this.table.rows({ filter: 'applied' }).every(function (rowIdx) {
                const rowNode = this.node();
                if (rowNode) {
                    rowNode.dataset.index = rowIdx; // Update the data-index only for visible rows
                }
            });
        });
        this.table.on('click', '.delete-rule', (event) => {
            const $button = $(event.target).closest('.delete-rule');
            const $row = $button.closest('tr');
            const dataIndex = parseInt($row.data('index'));
            
            if (isNaN(dataIndex)) {
                console.warn("Invalid data-index value");
                return;
            }

            // Add Bulma loading state - hides icon and shows spinner
            $button.addClass('is-loading');
            $button.prop('disabled', true);

            setTimeout(() => {
                const rules = this.ruleManager.getRules();
                if (dataIndex >= 0 && dataIndex < rules.length) {
                    this.ruleManager.deleteRule(dataIndex);
                    this.tableRenderer.render();
                } else {
                    console.warn("Index out of bounds:", dataIndex);
                    $button.removeClass('is-loading');
                    $button.prop('disabled', false);
                }
            }, 50);
        });
    }
}