import { clampLvlValues, sanitizeFilterName } from './utils.js';
import { 
    ruleManager,
    dropdownManager,
    toastManager,
    tableRenderer,
    storageManager,
    filterEncoder
} from '../globals.js';
export class EventManager {
    constructor(table) {
        this.table = table;
    }

    initialize() {
        if (!ruleManager.isDataLoaded()) {
            toastManager.showToast('Waiting for data to load...', true);
            return;
        }

        const defaultNotify = localStorage.getItem('defaultNotify') === 'true';
        const defaultMap = localStorage.getItem('defaultMap') === 'true';
        const defaultUnobtainableFilter = localStorage.getItem('defaultUnobtainableFilter') === 'true';

        $('#defaultNotify').prop('checked', defaultNotify);
        $('#defaultMap').prop('checked', defaultMap);
        $('#defaultUnobtainableFilter').prop('checked', defaultUnobtainableFilter);

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

        // Handle changes to defaultUnobtainableFilter
        $('#defaultUnobtainableFilter').on('change', (event) => {
            const isChecked = $(event.target).is(':checked');
            localStorage.setItem('defaultUnobtainableFilter', isChecked);
            ruleManager.processItems();
        });
        
        $('#shareFilter').on('click', () => {
            try {
                const filterData = ruleManager.generateOutput();
                const shareLink = filterEncoder.generateShortenedLink(JSON.parse(filterData));
                
                if (shareLink) {
                    navigator.clipboard.writeText(shareLink)
                        .then(() => {
                            toastManager.showToast('Share link copied', true);
                        })
                        .catch(() => {
                            // Fallback if clipboard API fails
                            prompt('Copy this compact link to share your filter:', shareLink);
                        });
                } else {
                    toastManager.showToast('Failed to generate share link', false, 'danger');
                }
            } catch (error) {
                console.error('Error sharing filter:', error);
                toastManager.showToast('Error sharing filter', false, 'danger');
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
            toastManager.showToast("Preferences saved!", true);
            $('#settingsModal').removeClass('is-active');
        });

        // Paste from clipboard
        $('#pasteFromClipboard').on('click', () => {
            try {
                const text = prompt("Please paste the JSON data here:");
                if (!text) {
                    toastManager.showToast("No data pasted.", true);
                    return;
                }

                const data = JSON.parse(text);
                if (data && typeof data === "object" && data.rules) {
                    $('#defaultShowItems').prop('checked', data.default_show_items);
                    $('#filterName').val(data.name);

                    ruleManager.clearRules();
                    data.rules.reverse().forEach(rule => ruleManager.addRule(rule));
                    tableRenderer.render();
                    toastManager.cleanUpToastMessages();
                } else {
                    toastManager.showToast("Invalid JSON format.");
                }
            } catch (error) {
                toastManager.showToast("Failed to paste: " + error);
            }
        });

        // Copy to clipboard
        $('#copyToClipboard').on('click', () => {
            const filterName = $('#filterName').val().trim();
            const output = ruleManager.generateOutput();

            navigator.clipboard.writeText(output)
                .then(() => toastManager.showToast(`Filter "${filterName}" copied to clipboard!`, true))
                .catch(err => toastManager.showToast("Failed to copy: " + err));
        });

        // Save to localStorage
        $('#saveToLocalStorage').on('click', () => {
            const filterName = sanitizeFilterName($('#filterName').val()).trim();
            if (!filterName) {
                toastManager.showToast("Please enter a filter name before saving.");
                return;
            }
        
            const filterData = ruleManager.generateOutput();
            storageManager.saveFilter(filterName, filterData);
            toastManager.showToast(`Filter "${filterName}" saved!`, true);
            dropdownManager.updateFilterSelect();
        });
        
        $('#loadFromLocalStorage').on('change', () => {
            toastManager.cleanUpToastMessages();
            const filterName = $('#loadFromLocalStorage').val().trim();
            if (!filterName) return;
            
            const filterData = storageManager.loadFilter(filterName);
            if (filterData) {
                const parsedData = JSON.parse(filterData);
                $('#defaultShowItems').prop('checked', parsedData.default_show_items);
                $('#filterName').val(filterName);
        
                ruleManager.clearRules();
                parsedData.rules.reverse().forEach(rule => ruleManager.addRule(rule));
                tableRenderer.render();
        
                toastManager.showToast(`Filter "${filterName}" loaded successfully!`, true);
            } else {
                toastManager.showToast(`Filter "${filterName}" not found.`, true);
            }
        });
        
        // Delete from localStorage
        $('#deleteFromLocalStorage').on('click', () => {
            const filterName = $('#filterName').val().trim();
            if (!filterName) {
                toastManager.showToast("Please select a filter to delete.", true);
                return;
            }
            
            const confirmDelete = confirm(`Are you sure you want to delete "${filterName}"?`);
            if (confirmDelete) {
                if (storageManager.deleteFilter(filterName)) {
                    toastManager.showToast(`Filter "${filterName}" deleted!`, true);
                    dropdownManager.updateFilterSelect();
                    
                    // Reset the UI
                    $('#filterName').val('');
                    dropdownManager.clearInputValue();
                    ruleManager.clearRules();
                    tableRenderer.render();
                } else {
                    toastManager.showToast(`Filter "${filterName}" not found.`, true);
                }
            }
        });

        $('#newFilter').on('click', () => {
            const confirmReset = confirm("Are you sure you want to create a new filter? This will clear all current rules and reset the filter.");

            if (confirmReset) {
                ruleManager.clearRules();
                toastManager.cleanUpToastMessages();
                
                $('#defaultShowItems').prop('checked', true);
                $('#filterName').val('').trigger('change');
                dropdownManager.clearInputValue();
                tableRenderer.render();
            }
        });

        // Table event listeners
        this.table.on('change', '.rule-is-active', async (event) => {
            const paramValue = $(event.target).is(":checked");
            const dataIndex = $(event.target).closest('tr').data('index');

            if (dataIndex !== undefined) {
                ruleManager.updateRule(dataIndex, { active: paramValue });
                
                // Get the updated row data
                const updatedRowData = await tableRenderer.createRowData(ruleManager.getRules()[dataIndex], dataIndex);
                
                // Update the table row
                tableRenderer.updateTableRow(dataIndex, updatedRowData);
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-is-shown', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
        
            if (dataIndex !== undefined) {
                ruleManager.updateRule(dataIndex, { show_item: paramValue == "1" })
        
                $(event.target).removeClass("has-text-success has-text-danger").addClass(tableRenderer.getShowClassName(dataIndex));
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-quality', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
        
            if (dataIndex !== undefined) {
                ruleManager.updateRule(dataIndex, { item_quality: Number(paramValue) })

                $(event.target).removeClass(ruleManager.getItemQuality().map(quality => quality.class).join(" "));
                $(event.target).addClass(tableRenderer.getQualityClassName(dataIndex));
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-is-eth', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
    
            if (dataIndex !== undefined) {
                ruleManager.updateRule(dataIndex, { ethereal: Number(paramValue) })
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-min-clvl', (event) => {
            const paramValue = $(event.target).val();
            const dataIndex = $(event.target).closest('tr').data('index');
            const clampedValue = clampLvlValues(paramValue);
            $(event.target).val(clampedValue);

            if (dataIndex !== undefined) {
                ruleManager.updateRule(dataIndex, { min_clvl: clampedValue });
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
                ruleManager.updateRule(dataIndex, { max_clvl: clampedValue });
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
                ruleManager.updateRule(dataIndex, { min_ilvl: clampedValue });
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
                ruleManager.updateRule(dataIndex, { max_ilvl: clampedValue });
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-is-notify', (event) => {
            const paramValue = $(event.target).is(":checked");
            const dataIndex =  $(event.target).closest('tr').data('index');
            
            if (dataIndex !== undefined) {
                ruleManager.updateRule(dataIndex, { notify: paramValue });
            } else {
                console.warn('Row does not have a valid data-index');
            }
        });
        this.table.on('change', '.rule-is-automap', (event) => {
            const paramValue = $(event.target).is(":checked");
            const dataIndex =  $(event.target).closest('tr').data('index');
            
            if (dataIndex !== undefined) {
                ruleManager.updateRule(dataIndex, { automap: paramValue });
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
                const rules = ruleManager.getRules();
                if (dataIndex >= 0 && dataIndex < rules.length) {
                    ruleManager.deleteRule(dataIndex);
                    tableRenderer.render();
                } else {
                    console.warn("Index out of bounds:", dataIndex);
                    $button.removeClass('is-loading');
                    $button.prop('disabled', false);
                }
            }, 50);
        });
    }
}