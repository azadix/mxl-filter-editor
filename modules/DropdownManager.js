export class DropdownManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.globalSelector = this.initializeGlobalSelector();
        this.updateFilterSelect();
    }

    updateFilterSelect() {
        const filterNames = this.storageManager.getFilterNames();
        const filterSelect = $('#loadFromLocalStorage');

        filterSelect.empty();
        filterSelect.append('<option value="" disabled selected hidden>Select a filter to load</option>');

        filterNames.forEach(filterName => {
            filterSelect.append(`<option value="${filterName}">${filterName}</option>`);
        });
    }

    initializeGlobalSelector() {
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'globalSelectorModal';
        modal.classList.add('modal');
        modal.innerHTML = `
            <div class="modal-background"></div>
            <div class="modal-content" style="height: 55%;">
                <select class="is-fullwidth" id="globalSelector"></select>
            </div>
            <button class="modal-close is-large" aria-label="close"></button>
        `;
        document.body.appendChild(modal);
        $(modal).find('.modal-background, .modal-close').on('click', () => this.closeGlobalSelectorModal());

        return $('#globalSelector').select2();
    }

    closeGlobalSelectorModal() {
        document.getElementById('globalSelectorModal').classList.remove('is-active');
    }
}