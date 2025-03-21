export class DropdownManager {
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

    destroySelect2() {
        document.querySelectorAll(".rule-param-value").forEach((el) => {
            if ($(el).data('select2')) {
                $(el).select2('destroy');
                $(el).removeData('select2');
            }
        });
    }
}