export class TableRenderer {

    constructor(table, ruleManager, dropdownManager, categoryImages) {
        this.table = table;
        this.ruleManager = ruleManager;
        this.dropdownManager = dropdownManager;
        this.CATEGORY_IMAGES = Object.freeze(categoryImages);
    }

    render() {
        this.table.rows().nodes().to$().off('*');
        this.table.clear();
        const rules = this.ruleManager.getRules()

        // Hide or show the table based on the number of rules
        if (rules.length === 0) {
            $('.dt-layout-table').hide();
        } else {
            $('.dt-layout-table').show();
        }

        rules.forEach((rule, index) => {
            const rowData = this.createRowData(rule, index);
            this.table.row.add(rowData).node();
        });
        this.table.draw();
        this.table.columns.adjust();
    }

    getShowClassName(index) {
        const rule = this.ruleManager.getRules()[index];
        return rule.show_item ? "has-text-success" : "has-text-danger";
    }

    createEtherealStateOptions(rule) {
        return Object.values(this.ruleManager.etherealStates).map(state => `
            <option value="${state.value}" ${rule.ethereal === state.value ? 'selected' : ''}>
                ${state.name}
            </option>`).join("");
    }

    getQualityClassName(index) {
        return this.ruleManager.getItemQuality().find(quality => quality.value === Number(this.ruleManager.getRules()[index].item_quality)).class;
    }

    updateTableRow(rowIndex, rowData) {
        const rowNode = this.table.row(rowIndex).node();
    
        if (rowNode) {
            this.table.row(rowIndex).data(rowData).draw(false);
            rowNode.dataset.index = rowIndex;
        } else {
            console.warn(`Row with index ${rowIndex} not found.`);
        }
    }

    createOptionParams(ruleType, jsonIndex) {
        const rule = this.ruleManager.getRules()[jsonIndex];
        const groupWrapper = document.createElement('div');
        const paramsWrapper = document.createElement('div');
        const paramsDatalist = document.createElement('select');

        paramsWrapper.classList.add("select", "width-100");
        paramsDatalist.classList.add("rule-param-value", "width-100");
        paramsDatalist.id = `param-value-${jsonIndex}`;
        groupWrapper.appendChild(this.createParamsDropdown(ruleType, jsonIndex));
        groupWrapper.appendChild(paramsWrapper);
        groupWrapper.classList.add("input-wrapper", "big-dropdown-width");

        const option = document.createElement("option");
        option.hidden = true;

        switch (ruleType) {
            case this.ruleManager.ruleTypes.ITEM.value:
                if (rule.params?.code === undefined) {
                    rule.params = { code: 0 };
                }

                option.value = rule.params?.code;
                option.text = this.ruleManager.getItemCodes().find(item => item.value === rule.params.code)?.name || "";
                paramsDatalist.appendChild(option);

                if (rule.params?.code !== undefined) {
                    paramsDatalist.value = rule.params.code;
                }

                paramsWrapper.appendChild(paramsDatalist);
                break;

            case this.ruleManager.ruleTypes.CLASS.value:
                if (rule.params?.class === undefined) {
                    rule.params = { class: 0 };
                }

                option.value = rule.params?.class;
                option.text = this.ruleManager.getItemClasses().find(item => item.value === rule.params.class)?.name || "";
                paramsDatalist.appendChild(option);

                if (rule.params?.class !== undefined) {
                    paramsDatalist.value = rule.params.class;
                }

                paramsWrapper.appendChild(paramsDatalist);
                break;
            default:
                paramsWrapper.classList.remove("width-100");
                break;
        }

        return groupWrapper;
    }

    createParamsDropdown(ruleType, index) {
        const outerWrapper = document.createElement('div');
        const selectParams = document.createElement('select');
        outerWrapper.classList.add("select");
        selectParams.classList.add("rule-param-type");
        selectParams.id = `param-type-${index}`;
        
        // Use the enum values directly
        Object.values(this.ruleManager.ruleTypes).forEach(type => {
            const option = document.createElement("option");
            option.value = type.value;
            option.text = type.name;
            selectParams.appendChild(option);
        });

        selectParams.value = ruleType;
        outerWrapper.appendChild(selectParams);
        return outerWrapper;
    }

    updateRowIndexes() {
        const rows = this.table.rows().nodes();
        
        $(rows).each((index, rowNode) => {
            $(rowNode).attr('data-index', index);
        });
    }

    createRowData(rule, index) {
        return [
            rule.id || Date.now(),
            `<span class="handle icon is-normal"><i class="fas fa-arrows-alt-v"></i></span>`,
            `<div class="checkbox-container"><input id="active-${index}" class="checkbox-input rule-is-active" type="checkbox" ${rule.active ? 'checked' : ''}></div>`,
            `<div class="select">
                <select id="show-${index}" class="rule-is-shown ${this.getShowClassName(index)}">
                    <option class="has-text-success" value="1" ${rule.show_item == "1" ? 'selected' : ''}>Show</option>
                    <option class="has-text-danger" value="0" ${rule.show_item == "0" ? 'selected' : ''}>Hide</option>
                </select>
            </div>`,
            `<div class="select">
                <select id="ethereal-${index}" class="rule-is-eth">
                    ${this.createEtherealStateOptions(rule)}
                </select>
            </div>`,
            `<div class="select">
                <select id="quality-${index}" class="rule-quality ${this.getQualityClassName(index)}">
                    ${this.ruleManager.getItemQuality().map(quality => `
                        <option class="${quality.class}" value="${quality.value}" ${rule.item_quality === quality.value ? 'selected' : ''}>
                            ${quality.name}
                        </option>
                    `).join("")}
                </select>
            </div>`,
            this.createOptionParams(rule.rule_type, index),
            `<div class="input-wrapper">
                <div><input class="input form-group-input rule-min-clvl" placeholder="0" id="min_clvl-${index}" type="number" value="${rule.min_clvl}"></div>
                <div><input class="input form-group-input rule-max-clvl" placeholder="0" id="max_clvl-${index}" type="number" value="${rule.max_clvl}"></div>
            </div>`,
            `<div class="input-wrapper">
                <div><input class="input form-group-input rule-min-ilvl" placeholder="0" id="min_ilvl-${index}" type="number" value="${rule.min_ilvl}"></div>
                <div><input class="input form-group-input rule-max-ilvl" placeholder="0" id="max_ilvl-${index}" type="number" value="${rule.max_ilvl}"></div>
            </div>`,
            `<div class="checkbox-container"><input id="notify-${index}" class="checkbox-input rule-is-notify" type="checkbox" ${rule.notify ? 'checked' : ''}></div>`,
            `<div class="checkbox-container"><input id="automap-${index}" class="checkbox-input rule-is-automap" type="checkbox" ${rule.automap ? 'checked' : ''}></div>`,
            `<div class="checkbox-container"><a class="button is-danger is-outlined delete-rule"><span class="icon"><i class="fas fa-trash"></i></span></a></div>`
        ];
    }

    formatItem = (value) => {
        if (!value?.id) {
            return value?.text || '';
        }

        let itemCategories = '';
        if (value.category && Array.isArray(value.category)) {
            value.category.forEach((category) => {
                const imageName = this.CATEGORY_IMAGES?.[category] || 'default';

                itemCategories +=`<span class="tag has-addons">
                                    <span class="tag p-0"><figure class="image is-16x16">
                                        <img src="assets/${imageName}.png" />
                                    </figure></span>
                                    <span class="tag">${category}</span>
                                </span>`;
            });
        }
        
        return $(`<span class="is-flex is-fullwidth" style="justify-content: space-between;">${value.text}<span class="is-right">${itemCategories}</span></span>`);
    }

    openGlobalSelectorModal(ruleType, currentValue, onChangeCallback) {
        // Clean up previous handlers
        this._globalSelectorHandlers?.change?.();
        
        // Destroy and recreate Select2 to ensure clean state
        if (this.dropdownManager.globalSelector.data('select2')) {
            this.dropdownManager.globalSelector.select2('destroy');
        }
    
        // Populate Select2 options based on ruleType
        const options = ruleType === this.ruleManager.ruleTypes.ITEM.value
                        ? this.ruleManager.getItemCodes()
                        : this.ruleManager.getItemClasses();
    
        const select2Data = options.map(option => ({
            id: option.value,
            text: option.name,
            category: option.category
        }));
    
        // Initialize Select2 with new options
        this.dropdownManager.globalSelector.empty().select2({
            data: select2Data,
            dropdownParent: $('#globalSelectorModal .modal-card-body'),
            width: '100%',
            dropdownAutoWidth: true,
            templateResult: this.formatItem,
            allowClear: false,
            matcher: function(params, data) {
                if ($.trim(params.term) === '') return data;
        
                const term = params.term.toLowerCase();
                const text = data.text.toLowerCase();
                const categories = Array.isArray(data.category) ? data.category : [];
    
                if (text.indexOf(term) > -1 || categories.some(cat => cat.toLowerCase().indexOf(term) > -1)) {
                    return data;
                }
                return null;
            }
        });
    
        // Set the current value
        this.dropdownManager.globalSelector.val(currentValue).trigger('change');
    
        // Handle value change
        const changeHandler = (e) => {
            const newValue = $(e.target).val();
            if (newValue !== currentValue) {
                onChangeCallback(newValue);
                this.dropdownManager.closeGlobalSelectorModal();
            }
        };
        
        this.dropdownManager.globalSelector.off('change').on('change', changeHandler);
        this._globalSelectorHandlers = { change: () => this.dropdownManager.globalSelector.off('change', changeHandler) };
    
        // Show modal and focus search
        this.dropdownManager.openGlobalSelectorModal();
        $('.select2-search__field').addClass('input');
        $('.select2-search__field').trigger('focus');
    }

    cleanupSelect2Instances() {
        // Clean up any Select2 instances in table rows
        this.table.$('.rule-param-value').each(function() {
            if ($(this).data('select2')) {
                $(this).select2('destroy');
            }
        });
        
        // Clean up quality dropdowns
        this.table.$('.rule-quality').each(function() {
            if ($(this).data('select2')) {
                $(this).select2('destroy');
            }
        });
        
        // Clean up other dropdowns
        this.table.$('.rule-is-shown, .rule-is-eth').each(function() {
            if ($(this).data('select2')) {
                $(this).select2('destroy');
            }
        });
    }
}