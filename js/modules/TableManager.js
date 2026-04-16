import {
    ruleManager,
    storageManager,
    toastManager,
    dropdownManager
} from '../globals.js';
import { TableRenderer } from './TableRenderer.js';
import { EventManager } from './EventManager.js';
export class TableManager {
    constructor() {
        this.selectedRowIndex = null; // Track selected row
        this.table = new DataTable('#rulesTable', {
            autoWidth: true,
            paging: false,
            compact: true,
            order: [],
            ordering: false,
            fixedHeader: true,
            targets: 'no-sort',
            scrollY: this.calculateTableHeight(),
            scrollCollapse: false,
            columnDefs: [
                { targets: 0, visible: false },
                { targets: 6, width: '30%' }
            ],
            layout: {
                topEnd: '',
                bottomStart: { info: { empty: '', text: 'Rule count: _TOTAL_' } }
            }
        });

        if (ruleManager.getRules().length === 0) {
            $('.dt-layout-table').hide();
        }

        this.tableRenderer = new TableRenderer(this.table, ruleManager, dropdownManager);
        this.tableRenderer.onAfterRender = () => this.syncRowSelectionFromState();
        this.eventManager = new EventManager(this.table, ruleManager, dropdownManager, toastManager, this.tableRenderer, storageManager);

        this.initialize();
        this.bindAddRuleButton();
    }

    bindAddRuleButton() {
        const addRuleButton = document.getElementById('addNewRule');
        if (addRuleButton) {
            addRuleButton.addEventListener('click', async () => {
                // Insert at selected position, or at top if no selection
                const insertIndex = this.selectedRowIndex !== null ? this.selectedRowIndex + 1 : 0;
                ruleManager.addRule(null, insertIndex);
                await this.tableRenderer.render();

                // Select the newly added row
                this.selectRow(insertIndex);
            });
        }
    }

    async initialize() {
        this.eventManager.initialize();
        await this.tableRenderer.render();
        this.initializeSortable();
        this.initializeRowSelection();
    }

    clearRowSelection() {
        const tableBody = document.querySelector('#rulesTable tbody');
        if (!tableBody) return;
        tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
        this.selectedRowIndex = null;
    }

    syncRowSelectionFromState() {
        if (this.selectedRowIndex === null) return;
        const tableBody = document.querySelector('#rulesTable tbody');
        if (!tableBody) return;
        const rows = tableBody.querySelectorAll('tr');
        const idx = this.selectedRowIndex;
        if (idx < 0 || idx >= rows.length) {
            this.selectedRowIndex = null;
            return;
        }
        this.selectRow(idx);
    }

    initializeRowSelection() {
        this._documentRowSelectionClick = (e) => {
            if (e.target.closest('.delete-rule, .duplicate-rule')) {
                return;
            }
            const row = e.target.closest('#rulesTable tbody tr');
            if (row) {
                const tableBody = document.querySelector('#rulesTable tbody');
                if (!tableBody) return;
                tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));
                row.classList.add('selected-row');
                this.selectedRowIndex = parseInt(row.dataset.index, 10);
            } else {
                this.clearRowSelection();
            }
        };
        document.addEventListener('click', this._documentRowSelectionClick);
    }

    calculateTableHeight() {
        const tableElement = document.querySelector('#rulesTable');
        const tableRect = tableElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Dynamically calculate the offset based on the height of other elements
        const headerHeight = document.querySelector('#header')?.offsetHeight || 0;
        const availableHeight = viewportHeight - tableRect.top - headerHeight;

        return availableHeight;
    }

    initializeSortable() {
        const tableBody = document.querySelector('#rulesTable tbody');
        if (!tableBody) {
            console.error("Table body not found.");
            return;
        }

        if (this._sortableInstance) {
            this._sortableInstance.destroy();
        }

        this._sortableInstance = Sortable.create(tableBody, {
            handle: '.handle',
            animation: 150,
            onEnd: async () => {
                const rows = Array.from(tableBody.querySelectorAll('tr'));
                const newOrder = rows.map(row => parseInt(row.dataset.index, 10));
                ruleManager.reorderRules(newOrder);
                await this.tableRenderer.render();
            }
        });
    }

    selectRow(index) {
        const tableBody = document.querySelector('#rulesTable tbody');
        if (!tableBody) return;

        // Remove previous selection
        tableBody.querySelectorAll('tr').forEach(r => r.classList.remove('selected-row'));

        // Find and select the row with the specified index
        const rows = tableBody.querySelectorAll('tr');
        if (rows[index]) {
            rows[index].classList.add('selected-row');
            this.selectedRowIndex = parseInt(rows[index].dataset.index, 10);
        } else {
            this.selectedRowIndex = null;
        }
    }

    destroy() {
        // Remove all DataTable event listeners and destroy table
        this.table.off();
        this.table.clear();
        this.table.destroy(true);

        // Destroy sortable instance
        if (this._sortableInstance) {
            this._sortableInstance.destroy();
            this._sortableInstance = null;
        }

        // Clear any pending timeouts
        if (this._pendingTimeouts) {
            this._pendingTimeouts.forEach(timeout => clearTimeout(timeout));
            this._pendingTimeouts = [];
        }

        // Clean up table renderer and event manager
        if (this.tableRenderer) {
            this.tableRenderer = null;
        }

        if (this.eventManager) {
            this.eventManager = null;
        }

        if (this._documentRowSelectionClick) {
            document.removeEventListener('click', this._documentRowSelectionClick);
            this._documentRowSelectionClick = null;
        }

        // Remove all event listeners
        $('#defaultNotify, #defaultMap, #filterSettings, #pasteFromClipboard, #copyToClipboard, #saveToLocalStorage, #deleteFromLocalStorage, #newFilter, #browseTswFilters').off();
        $('#settingsModal .modal-background, #settingsModal .modal-card-foot .button').off();
        $('#browseTswFiltersModal .modal-background, #browseTswFiltersCancel, #browseTswFiltersClose, #browseTswFiltersLoad').off();
        $(document).off('click', '.delete-rule');

        // Clear table reference
        this.table = null;
    }
}
