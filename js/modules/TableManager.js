import { EventManager } from './EventManager.js';
import { TableRenderer } from './TableRenderer.js';

export class TableManager {
    constructor(ruleManager, storageManager, toastManager, dropdownManager) {
        this.ruleManager = ruleManager;
        this.storageManager = storageManager;
        this.toastManager = toastManager;
        this.dropdownManager = dropdownManager;

        this.CATEGORY_IMAGES = {
            "#Charm": "charm",
            "#Essence": "essence",
            "#Fragment": "fragment",
            "#Other": "other",
            "#Quest item": "quest-item",
            "#Tenet": "tenet",
            "#Lootbox": "lootbox",
            "#Rune": "rune",
            "#Elemental Rune": "elemental-rune",
            "#Enchanted Rune": "enchanted-rune",
            "#Mystic Orb": "mystic-orb",
            "#UMO": "umo",
            "#Gem": "gem"
        };

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
            columnDefs: [{ targets: 0, visible: false }],
            layout: {
                topStart: () => this.createAddRuleButton(),
                topEnd: 'search',
                bottomStart: { info: { empty: '', text: 'Rule count: _TOTAL_' } }
            }
        });

        if (this.ruleManager.getRules().length === 0) {
            $('.dt-layout-table').hide();
        }

        this.tableRenderer = new TableRenderer(this.table, this.ruleManager, this.dropdownManager, this.CATEGORY_IMAGES);
        this.eventManager = new EventManager(this.table, this.ruleManager, this.dropdownManager, this.toastManager, this.tableRenderer, this.storageManager);
        
        this.initialize();
    }

    initialize() {
        this.eventManager.initialize();
        this.tableRenderer.render();
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
            onEnd: () => {
                const rows = Array.from(tableBody.querySelectorAll('tr'));
                const newOrder = rows.map(row => parseInt(row.dataset.index, 10));
                this.ruleManager.reorderRules(newOrder);
                this.tableRenderer.render();
            }
        });

        // Disiable sorting if searching is in progress
        const searchInput = document.querySelector('#dt-search-0');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const hasSearch = e.target.value.trim() !== '';
                
                this._sortableInstance.option('disabled', hasSearch);
                
                // Visual feedback
                const handles = document.querySelectorAll('.handle');
                handles.forEach(handle => {
                    handle.style.cursor = hasSearch ? 'not-allowed' : 'ns-resize';
                    handle.style.opacity = hasSearch ? '0.5' : '1';
                });
            });
        }
    }

    createAddRuleButton() {
        const addRuleButton = document.createElement('button');
        addRuleButton.classList.add("button", "is-success", "is-outlined", "is-inverted");
        addRuleButton.innerHTML = '<span class="icon is-small"><i class="fas fa-plus"></i></span><span>Add new rule</span>';

        addRuleButton.addEventListener("click", () => {
            this.ruleManager.addRule();
            this.tableRenderer.render();
        });

        return addRuleButton;
    }

    destroy() {
        this.table.off();
        this.table.destroy(true);
    
        if (this._sortableInstance) {
            this._sortableInstance.destroy();
        }

        // Clear any pending timeouts
        if (this._pendingTimeouts) {
            this._pendingTimeouts.forEach(timeout => clearTimeout(timeout));
            this._pendingTimeouts = [];
        }
    
        this.cleanupSelect2Instances();
    
        // Remove all event listeners
        $('#defaultNotify, #defaultMap, #filterSettings, #pasteFromClipboard, #copyToClipboard, #saveToLocalStorage, #loadFromLocalStorage, #deleteFromLocalStorage, #newFilter').off();
        $('#settingsModal .modal-background, #settingsModal .modal-card-foot .button').off();
        $(document).off('keydown.globalSelector');
        $(document).off('click', '.delete-rule');
    
        // Clean up global selector
        if (this.dropdownManager.globalSelector) {
            this.dropdownManager.globalSelector.select2('destroy').off();
        }

        $('#globalSelectorModal').remove();
    }
}