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
                topStart: () => this.createAddRuleButton(),
                topEnd: '',
                bottomStart: { info: { empty: '', text: 'Rule count: _TOTAL_' } }
            }
        });

        if (ruleManager.getRules().length === 0) {
            $('.dt-layout-table').hide();
        }

        this.tableRenderer = new TableRenderer(this.table, ruleManager, dropdownManager);
        this.eventManager = new EventManager(this.table, ruleManager, dropdownManager, toastManager, this.tableRenderer, storageManager);
        
        this.initialize();
    }

    async initialize() {
        this.eventManager.initialize();
        await this.tableRenderer.render();
        this.initializeSortable();
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

    createAddRuleButton() {
        const addRuleButton = document.createElement('button');
        addRuleButton.classList.add("button", "is-success", "is-outlined", "is-inverted");
        addRuleButton.innerHTML = '<span class="icon is-small"><i class="fas fa-plus"></i></span><span>Add new rule</span>';

        addRuleButton.addEventListener("click", async () => {
            ruleManager.addRule();
            await this.tableRenderer.render();
        });

        return addRuleButton;
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
    
        // Remove all event listeners
        $('#defaultNotify, #defaultMap, #filterSettings, #pasteFromClipboard, #copyToClipboard, #saveToLocalStorage, #deleteFromLocalStorage, #newFilter').off();
        $('#settingsModal .modal-background, #settingsModal .modal-card-foot .button').off();
        $(document).off('click', '.delete-rule');
        
        // Clear table reference
        this.table = null;
    }
}