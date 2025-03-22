export class DropdownManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
    }

    initializeSelect() {
        document.querySelectorAll(".rule-param-value").forEach((el) => {
            $(el).select2({
                theme: "default",
                selectionCssClass: "select"
            });

            $(el).on('select2:open', () => {
                $('.select2-container .select2-search__field').addClass('input is-dark');
            });
        });

        $('b[role="presentation"]').hide();
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
                $(el).select2('destroy');

                // Remove all event listeners attached to the element
                $(el).off();
                el.remove();
            }
        });
    }
}