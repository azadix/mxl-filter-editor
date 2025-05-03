export class DropdownManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.globalSelector = this.initializeGlobalSelector();
        this.initializeFilterSelect();
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

        // Add ESC key handler
        $(document).on('keydown.globalSelector', (e) => {
            if (e.key === 'Escape' && $('#globalSelectorModal').hasClass('is-active')) { this.closeGlobalSelectorModal(); }
        });
        
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

    initializeFilterSelect() {
        const $select = $('#loadFromLocalStorage');
        
        $select.select2({
            width: '100%',
            placeholder: 'Select a filter',
            allowClear: false,
            minimumResultsForSearch: 5,
            templateResult: this.formatFilterOption.bind(this),
            templateSelection: this.formatFilterOption.bind(this),
        });
    
        // Update the empty option to be a placeholder only
        $select.empty().append('<option></option>');
        this.updateFilterSelect();

        $(document).on('mousedown.select2', (e) => {
            if (!$select.has(e.target).length && 
                !$(e.target).closest('.select2-container').length) {
                $select.select2('close');
            }
        });
    }
    
    updateFilterSelect() {
        const $select = $('#loadFromLocalStorage');
        const currentValue = $select.val();
        $select.find('option:not(:empty)').remove();
        
        this.storageManager.getFilterMetadata()
            .sort((a, b) => new Date(b.lastSavedAt) - new Date(a.lastSavedAt))
            .forEach(filter => {
                $select.append(
                    `<option value="${filter.name}" data-last-saved="${filter.lastSavedAt}">
                        ${filter.name}
                    </option>`
                );
            });
        
        // Restore selection if it still exists
        if (currentValue && $select.find(`option[value="${currentValue}"]`).length) {
            $select.val(currentValue);
        }
        
        $select.trigger('change');
    }

    formatFilterOption(data) {
        if (!data.id) return data.text;
        
        const $option = $(data.element);
        const lastSaved = $option.data('last-saved');
        if (!lastSaved) return data.text;
        
        const formattedDate = this.formatDate(lastSaved);
        
        const $wrapper = $('<div>').addClass('is-flex is-fullwidth');
        $wrapper.css("justify-content", "space-between");
        $wrapper.append(
            $('<span>').text(data.text),
            $('<span>').addClass('filter-date is-right is-hidden-touch is-hidden-desktop-only').text(`Last saved: ${formattedDate}`)
        );
        
        return $wrapper;
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