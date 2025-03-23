export class DropdownManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
    }

    updateFilterSelect() {
        const filterNames = this.storageManager.getFilterNames();
        const filterSelect = $('#loadFromLocalStorage');

        filterSelect.empty();
        filterSelect.append('<option value="" disabled selected hidden>Select a filter</option>');

        filterNames.forEach(filterName => {
            filterSelect.append(`<option value="${filterName}">${filterName}</option>`);
        });
    }

    destroySelect() {
        document.querySelectorAll(".rule-param-value").forEach((el) => {
            if ($(el).data('select2')) {
                $(el).off();
                $(el).select2('destroy');
                el.remove();
            }
        });
    }
}