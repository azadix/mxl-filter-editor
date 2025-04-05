export class DropdownManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.globalSelector = this.initializeGlobalSelector();
        this.updateFilterSelect();
    }

    updateFilterSelect() {
        const $select = $('#loadFromLocalStorage');
        $select.empty().append('<option hidden value="">Select a filter</option>');
        
        this.storageManager.getFilterMetadata()
            .sort((a, b) => new Date(b.lastSavedAt) - new Date(a.lastSaved))
            .forEach(filter => {
                $select.append(`<option value="${filter.name}">${filter.name}</option>`);
            });
    }

    initializeGlobalSelector() {
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'globalSelectorModal';
        modal.classList.add('modal');
        modal.innerHTML = `
            <div class="modal-background"></div>
            <div class="modal-card" style="height: 68vh;">
                <section class="modal-card-body p-0">
                    <select class="is-fullwidth" id="globalSelector"></select>
                </section>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close modal when clicking background or close button
        $(modal).find('.modal-background, .modal-card-head .delete').on('click', () => this.closeGlobalSelectorModal());
        
        // Prevent click events from propagating to modal background
        $(modal).find('.modal-card').on('click', (e) => e.stopPropagation());

        return $('#globalSelector').select2({
            dropdownParent: $('#globalSelectorModal .modal-card-body')
        }).maximizeSelect2Height();
    }

    closeGlobalSelectorModal() {
        $('#globalSelectorModal').removeClass('is-active');
    }

    openGlobalSelectorModal() {
        $('#globalSelectorModal').addClass('is-active');
        this.globalSelector.select2('open');
    }
}