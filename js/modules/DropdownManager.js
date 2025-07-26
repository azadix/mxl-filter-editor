import { 
    storageManager,
    toastManager,
    ruleManager,
    tableRenderer
} from '../globals.js';
import { DropdownList } from './DropdownList.js';

export class DropdownManager {
    constructor() {
        this.filterSelect = null;
        this.initializeFilterSelect();
    }

    initializeFilterSelect() {
        this.filterSelect = new DropdownList(document.getElementById('loadFromLocalStorage'), {
            placeholder: 'Load saved filter...',
            doNotFilterElement: true,
            isReadOnly: true,
            template: (item) => this.formatFilterOption(item),
            onSelect: (item) => this.handleFilterSelection(item)
        });

        this.updateFilterSelect();

        // Improved outside click handling
        document.addEventListener('click', (e) => {
            const isClickInside = this.filterSelect.container.contains(e.target);
            if (!isClickInside) {
                this.filterSelect.hideList();
            }
        });

        // Prevent hiding when clicking on the dropdown itself
        this.filterSelect.container.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    clearInputValue() {
        if (this.filterSelect != null) {
            this.filterSelect.input.value ='';
            this.filterSelect.selectedItem = null;
        }
    }

    handleFilterSelection(item) {
        if (!item || !item.value) return;
        
        const filterName = item.value;
        const filterData = storageManager.loadFilter(filterName);
        
        if (filterData) {
            const parsedData = JSON.parse(filterData);
            $('#defaultShowItems').prop('checked', parsedData.default_show_items);
            $('#filterName').val(filterName);

            // Use the eventManager to handle the filter loading
            ruleManager.clearRules();
            parsedData.rules.reverse().forEach(rule => ruleManager.addRule(rule));
            tableRenderer.render();
            
            toastManager.showToast(`Filter "${filterName}" loaded successfully!`, true);
        } else {
            toastManager.showToast(`Filter "${filterName}" not found.`, false, 'danger');
        }
    }

    updateFilterSelect() {
        const filters = storageManager.getFilterMetadata()
            .sort((a, b) => new Date(b.lastSavedAt) - new Date(a.lastSavedAt))
            .map(filter => ({
                value: filter.name,
                text: filter.name,
                lastSavedAt: filter.lastSavedAt
            }));

        this.filterSelect.setItems(filters);
    }

    formatFilterOption(item) {
        const formattedDate = this.formatDate(item.lastSavedAt);
        return `
            <div class="is-flex is-fullwidth" style="justify-content: space-between;">
                <span>${item.text}</span>
                <span class="filter-date">Last saved: ${formattedDate}</span>
            </div>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}