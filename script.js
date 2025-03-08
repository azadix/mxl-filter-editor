$(document).ready(function () {
    let jsonData = [];
    let itemQuality = {};
    let itemCodes = {};
    let itemClasses = {};

    const etherealState = {
        "Either": 0,
        "Yes": 1,
        "No": 2
    }

    const ruleTypes = {
        "None": -1,
        "Item": 1,
        "Class": 0
    }

    $.ajax({
        url: './data/itemQuality.json',
        dataType: 'json',
        success: function(data) {
          itemQuality = data;
        },
        error: function(xhr, status, error) {
          console.error('Error loading JSON file:', error);
          itemQuality = {};
        }
    });

    const excludedHexCodes = ["leek","lmz","gob","lms","c@c"];

    $.ajax({
        url: './data/file_parser/itemCode.json',
        dataType: 'json',
        success: function(data) {            
            itemCodes = data.filter(item => !excludedHexCodes.includes(item.hexCode));
            itemCodes.sort((a, b) => a.name.localeCompare(b.name));
        },
        error: function(xhr, status, error) {
            console.error('Error loading JSON file:', error);
            itemCodes = {};
        }
    });

    $.ajax({
        url: './data/itemClass.json',
        dataType: 'json',
        success: function(data) {
            itemClasses = data;
        },
        error: function(xhr, status, error) {
            console.error('Error loading JSON file:', error);
            itemClasses = {};
        }
    });

    let table = new DataTable('#rulesTable', {
        autoWidth: true,
        paging: false,
        compact: true,
        order: [],
        fixedHeader: true,
        targets: 'no-sort',
        scrollY: 625,
        scrollCollapse: false,
        columnDefs: [
            {
                visible: false,
                targets: 0
            }
        ],
        layout: {
            topStart: function () {
                return createAddRuleButton();
            },
            topEnd: '',
            bottomStart: {
                info: {
                    empty: '',
                    text: 'Rule count: _TOTAL_',
                }
            }
        }
    });

    const defaultRule = {
        id: Date.now(),
        active: true,
        show_item: true,
        item_quality: -1,
        qualityClass: "has-text-white",
        showClass: "has-text-success",
        ethereal: 0,
        min_clvl: 0,
        max_clvl: 0,
        min_ilvl: 0,
        max_ilvl: 0,
        rule_type: -1,
        params: null,
        notify: true,
        automap: true
    };

    function createAddRuleButton() {
        const addRuleButton = document.createElement('button');
        addRuleButton.classList.add("button", "is-success", "is-outlined", "is-inverted");
        addRuleButton.innerHTML = '<span class="icon is-small"><i class="fas fa-plus"></i></span><span>Add new rule</span>';

        // Add click event to append a new row
        addRuleButton.addEventListener("click", () => {
            const newRule = JSON.parse(JSON.stringify(defaultRule));
            newRule.id = Date.now();

            jsonData.unshift(newRule);
            renderTableFromJson();
        });

        return addRuleButton;
    }

    function createParamsDropdown(ruleType) {
        const outerWrapper = document.createElement('div');
        const selectParams = document.createElement('select');
        outerWrapper.classList.add("select");
        selectParams.classList.add("rule-param-type")

        Object.entries(ruleTypes).forEach(([key, value]) => {
            let option = document.createElement("option");
            option.value = value;
            option.text = key;
            selectParams.appendChild(option);
        });

        selectParams.value = ruleType;
        outerWrapper.appendChild(selectParams);
        return outerWrapper;
    }

    function createOptionParams(ruleType, jsonIndex ) {
        let groupWrapper = document.createElement('div');
        let datalistWrapper = document.createElement('div');
        let datalist = document.createElement('select');
    
        datalistWrapper.classList.add("select", "width-100");
        datalist.classList.add("rule-param-value", "width-100");
        
        groupWrapper.appendChild(createParamsDropdown(ruleType));
        groupWrapper.appendChild(datalistWrapper);
        groupWrapper.classList.add("input-wrapper", "min-width-500");
        
        switch (Number(ruleType)) {
            case 1: // Items
                // Object.entries(itemCodes).forEach(([key, value]) => {
                //     let option = document.createElement("option");
                //     option.value = value;
                //     option.text = key;
                //     datalist.appendChild(option);
                // });

                itemCodes.forEach(item => {
                    let option = document.createElement("option");
                    option.value = item.value;
                    option.text = item.name;
                    datalist.appendChild(option);
                });
    
                // Set the value of the datalist based on jsonData
                if (jsonData[jsonIndex]?.params?.code !== undefined) {
                    datalist.value = jsonData[jsonIndex].params.code;
                }
                datalistWrapper.appendChild(datalist);
                return groupWrapper;
    
            case 0: // Class
                Object.entries(itemClasses).forEach(([key, value]) => {
                    let option = document.createElement("option");
                    option.value = value;
                    option.text = key;
                    datalist.appendChild(option);
                });
    
                // Set the value of the datalist based on jsonData
                if (jsonData[jsonIndex]?.params?.class !== undefined) {
                    datalist.value = jsonData[jsonIndex].params.class;
                }
                datalistWrapper.appendChild(datalist);
                return groupWrapper;
    
            default:
                datalistWrapper.classList.remove("width-100");
                return groupWrapper;
        }
    }

    $('#newFilter').on('click', function () {
        const confirmReset = confirm("Are you sure you want to create a new filter? This will clear all current rules and reset the filter.");
    
        if (confirmReset) {
            jsonData = [];
            $('#defaultShowItems').prop('checked', true);
            $('#filterName').val('');
            $('#loadFromLocalStorage').val('');
            $('#loadFromLocalStorage option[value=""]').prop('selected', true);

            renderTableFromJson();

            showToast("New filter created successfully!", true);
        } else {
            showToast("New filter creation canceled.", true);
        }
    });

    $('#pasteFromClipboard').on('click', function () {
        try {
            let text = prompt("Please paste the JSON data here:");
            if (!text) {
                showToast("No data pasted.", true);
                return;
            }
    
            const data = JSON.parse(text);
    
            if (data && typeof data === "object" && data.rules) {
                // Map the item_quality to the corresponding class name
                jsonData = data.rules.map(rule => {
                    const selectedQuality = Object.entries(itemQuality).find(([key, [value]]) => value === rule.item_quality);
                    rule.qualityClass = selectedQuality ? selectedQuality[1][1] : "";
                    rule.showClass = rule.show_item ? "has-text-success" : "has-text-danger";
                    return rule;
                });
    
                $('#defaultShowItems').prop('checked', data.default_show_items);
                $('#filterName').val(data.name);
    
                renderTableFromJson();
            } else {
                showToast("Invalid JSON format.");
            }
        } catch (error) {
            showToast("Failed to paste: " + error);
        }
    });

    $('#copyToClipboard').on('click', function () {
        navigator.clipboard.writeText(generateOutput())
            .then(() => showToast("Filter copied to clipboard!", true))
            .catch(err => showToast("Failed to copy: " + err));
    });

    $('#saveToLocalStorage').on('click', function () {
        const filterName = $('#filterName').val().trim();
    
        if (!filterName) {
            showToast("Please enter a filter name before saving.");
            return;
        }

        cleanedFilterName = sanitizeFilterName(filterName);

        if (!cleanedFilterName) {
            showToast("Invalid filter name. Please use only alphanumeric characters, spaces, hyphens, and underscores.", true);
            return;
        }
    
        const filterData = generateOutput();
    
        localStorage.setItem(cleanedFilterName, filterData);
    
        showToast(`Filter "${cleanedFilterName}" saved to local storage!`, true);
        updateLoadDropdown();
    });

    $('#loadFromLocalStorage').on('change', function () {
        const filterName = $(this).val();
    
        if (!filterName) {
            return;
        }

        const filterData = JSON.parse(localStorage.getItem(filterName));
    
        if (filterData) {
            jsonData = filterData.rules.map(rule => {
                const selectedQuality = Object.entries(itemQuality).find(([key, [value]]) => value === rule.item_quality);
                rule.qualityClass = selectedQuality ? selectedQuality[1][1] : "";
    
                rule.showClass = rule.show_item ? "has-text-success" : "has-text-danger";
                return rule;
            });
    
            $('#defaultShowItems').prop('checked', filterData.default_show_items);
            $('#filterName').val(filterData.name);
    
            renderTableFromJson();
    
            showToast(`Filter "${filterName}" loaded successfully!`, true);
        } else {
            showToast(`Filter "${filterName}" not found in local storage.`, true);
        }
    });

    $('#deleteFromLocalStorage').on('click', function () {
        const filterName = $('#filterName').val().trim();
    
        if (!filterName) {
            showToast("Please select a filter to delete.", true);
            return;
        }
    
        if (localStorage.getItem(filterName)) {
            localStorage.removeItem(filterName);
            showToast(`Filter "${filterName}" deleted from local storage!`, true);
            updateLoadDropdown();
        } else {
            showToast(`Filter "${filterName}" not found in local storage.`, true);
        }
    });
    
    table.on('change', '.rule-is-active', function () {
        const paramValue = $(this).is(":checked");
        const dataIndex =  $(this).closest('tr').data('index');

        if (dataIndex !== undefined) {
            jsonData[dataIndex].active = paramValue;
        } else {
            console.warn('Row does not have a valid data-index');
        }
        renderTableFromJson();
    });
    table.on('change', '.rule-is-shown', function () {
        const paramValue = $(this).val();
        const dataIndex = $(this).closest('tr').data('index');
    
        if (dataIndex !== undefined) {
            jsonData[dataIndex].show_item = paramValue === "1";

            const showClass = paramValue === "1" ? "has-text-success" : "has-text-danger";
            jsonData[dataIndex].showClass = showClass;
    
            $(this).removeClass("has-text-success has-text-danger").addClass(showClass);
        } else {
            console.warn('Row does not have a valid data-index');
        }
    });
    table.on('change', '.rule-quality', function () {
        const paramValue = $(this).val();
        const dataIndex = $(this).closest('tr').data('index');
    
        if (dataIndex !== undefined) {
            jsonData[dataIndex].item_quality = Number(paramValue);
    
            const selectedQuality = Object.entries(itemQuality).find(([key, [value]]) => value === Number(paramValue));
            const className = selectedQuality ? selectedQuality[1][1] : "";
    
            jsonData[dataIndex].qualityClass = className;
    
            $(this).removeClass((index, className) => {
                return Object.values(itemQuality).map(([value, cls]) => cls).join(" ");
            });
    
            if (className) {
                $(this).addClass(className);
            }
        } else {
            console.warn('Row does not have a valid data-index');
        }
    });
    table.on('change', '.rule-is-eth', function () {
        const paramValue = $(this).val();
        const dataIndex =  $(this).closest('tr').data('index');
        
        if (dataIndex !== undefined) {
            jsonData[dataIndex].ethereal = Number(paramValue);
        } else {
            console.warn('Row does not have a valid data-index');
        }
    });

    table.on('change', '.rule-param-type', function () {
        const paramValue = $(this).val();
        const dataIndex =  $(this).closest('tr').data('index');
        
        if (dataIndex !== undefined) {
            jsonData[dataIndex].rule_type = Number(paramValue);

            switch (paramValue) {
                case "-1":
                    jsonData[dataIndex].params = null;
                    break;
                case "0":
                    jsonData[dataIndex].params = {class: 0}
                    break;
                case "1":
                    jsonData[dataIndex].params = {code: 0}
                    break;
            }
        } else {
            console.warn('Row does not have a valid data-index');
        }
        renderTableFromJson();
    });
    table.on('change', '.rule-param-value', function () {
        const paramValue = $(this).val();
        const dataIndex =  $(this).closest('tr').data('index');
        
        if (dataIndex !== undefined) {
            if (Number(paramValue) <= findLargestValue(itemClasses)) {
                jsonData[dataIndex].params.class = Number(paramValue)
            } else {
                jsonData[dataIndex].params.code = Number(paramValue)
            }
        } else {
            console.warn('Row does not have a valid data-index');
        }
    });
    table.on('change', '.rule-min-clvl', function () {
        const paramValue = $(this).val();
        $(this).val(clampLvlValues(paramValue))
        const dataIndex =  $(this).closest('tr').data('index');
        
        if (dataIndex !== undefined) {
            jsonData[dataIndex].min_clvl = clampLvlValues(paramValue);
        } else {
            console.warn('Row does not have a valid data-index');
        }
    });
    table.on('change', '.rule-max-clvl', function () {
        const paramValue = $(this).val();
        $(this).val(clampLvlValues(paramValue))
        const dataIndex =  $(this).closest('tr').data('index');
        
        if (dataIndex !== undefined) {
            jsonData[dataIndex].max_clvl = clampLvlValues(paramValue);
        } else {
            console.warn('Row does not have a valid data-index');
        }
    });
    table.on('change', '.rule-min-ilvl', function () {
        const paramValue = $(this).val();
        $(this).val(clampLvlValues(paramValue))
        const dataIndex =  $(this).closest('tr').data('index');
        
        if (dataIndex !== undefined) {
            jsonData[dataIndex].min_ilvl = clampLvlValues(paramValue);
        } else {
            console.warn('Row does not have a valid data-index');
        }
    });
    table.on('change', '.rule-max-ilvl', function () {
        const paramValue = $(this).val();
        $(this).val(clampLvlValues(paramValue))
        const dataIndex =  $(this).closest('tr').data('index');
        
        if (dataIndex !== undefined) {
            jsonData[dataIndex].max_ilvl = clampLvlValues(paramValue);
        } else {
            console.warn('Row does not have a valid data-index');
        }
    });
    table.on('change', '.rule-is-notify', function () {
        const paramValue = $(this).is(":checked");
        const dataIndex =  $(this).closest('tr').data('index');
        
        if (dataIndex !== undefined) {
            jsonData[dataIndex].notify = paramValue;
        } else {
            console.warn('Row does not have a valid data-index');
        }
    });
    table.on('change', '.rule-is-automap', function () {
        const paramValue = $(this).is(":checked");
        const dataIndex =  $(this).closest('tr').data('index');
        
        if (dataIndex !== undefined) {
            jsonData[dataIndex].automap = paramValue;
        } else {
            console.warn('Row does not have a valid data-index');
        }
    });

    table.on('draw', function () {
        table.rows().every(function (rowIdx) {
            const rowNode = this.node();
            rowNode.dataset.index = rowIdx;
        });
    });
    
    table.on('click', '.delete-rule', function () {
        const index = $(this).closest('tr').data('index');
        
        if (index !== undefined && index >= 0 && index < jsonData.length) {
            jsonData.splice(index, 1);
            renderTableFromJson();
        } else {
            console.warn("Invalid index or index out of bounds.");
        }
    });
    
    function addSortables() {
        const rulesTable = document.getElementById("rulesTable");
        const tbody = rulesTable ? rulesTable.querySelector('tbody') : null;
    
        if (tbody) {
            new Sortable(tbody, {
                handle: '.handle',
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: function () {
                    // Create a new sorted list based on the current DOM order
                    const newOrder = Array.from(tbody.children).map(ruleItem => {
                        const updatedIndex = ruleItem.dataset.index;
                        return jsonData[updatedIndex];
                    });

                    jsonData = newOrder;
                    renderTableFromJson()
                }
            });
        } else {
            console.warn("No tbody found");
        }
    }

    function renderTableFromJson() {
        table.clear();
        jsonData.forEach((item, index) => {
            // Prepare row data
            const rowData = [
                item.id | Date.now(),
                `<span class="handle icon is-normal"><i class="fas fa-arrows-alt-v"></i></span>`,
                `<div class="checkbox-container"><input id="active" class="checkbox-input rule-is-active" type="checkbox" ${item.active ? 'checked' : ''}></div>`,
                `<div class="select">
                    <select class="rule-is-shown ${item.showClass || ''}">
                        <option class="has-text-success" value="1" ${item.show_item == "1" ? 'selected' : ''}>Show</option>
                        <option class="has-text-danger" value="0" ${item.show_item == "0" ? 'selected' : ''}>Hide</option>
                    </select>
                </div>`,
                `<div class="select">
                    <select class="rule-is-eth">
                        ${Object.entries(etherealState).map(([key, value]) => `
                            <option value="${value}" ${item.ethereal === value ? 'selected' : ''}>${key}</option>
                        `).join("")}
                    </select>
                </div>`,
                `<div class="select">
                    <select class="rule-quality ${item.qualityClass || ''}">
                        ${Object.entries(itemQuality).map(([key, [value, className]]) => `
                            <option class="${className}" value="${value}" ${item.item_quality === value ? 'selected' : ''}>${key}</option>
                        `).join("")}
                    </select>
                </div>`,
                createOptionParams(item.rule_type, index),
                `<div class="input-wrapper">
                    <div><input class="input form-group-input rule-min-clvl" placeholder="0" id="min_clvl" type="number" value="${item.min_clvl}"></div>
                    <div><input class="input form-group-input rule-max-clvl" placeholder="0" id="max_clvl" type="number" value="${item.max_clvl}"></div>
                </div>`,
                `<div class="input-wrapper">
                    <div><input class="input form-group-input rule-min-ilvl" placeholder="0" id="min_ilvl" type="number" value="${item.min_ilvl}"></div>
                    <div><input class="input form-group-input rule-max-ilvl" placeholder="0" id="max_ilvl" type="number" value="${item.max_ilvl}"></div>
                </div>`,
                `<div class="checkbox-container"><input id="notify" class="checkbox-input rule-is-notify" type="checkbox" ${item.notify ? 'checked' : ''}></div>`,
                `<div class="checkbox-container"><input id="automap" class="checkbox-input rule-is-automap" type="checkbox" ${item.automap ? 'checked' : ''}></div>`,
                `<div class="checkbox-container"><a class="button is-danger is-outlined delete-rule"><i class="fas fa-trash pr-1"></i></a></div>`
            ];
            table.row.add(rowData).node();
        });
        table.draw();
        table.columns.adjust();
        initializeSelect();
    }

    function initializeSelect() {
        document.querySelectorAll(".rule-param-value").forEach((el)=>{
            $(el).select2({
                theme: "default",
                selectionCssClass: "select"
            });
            
            $(el).on('select2:open', function () {
                $('.select2-container .select2-search__field').addClass('input is-dark');
            });
        });


        $('b[role="presentation"]').hide();
    }

    function findLargestValue(jsonData) {
        let largestValue = -Infinity;
    
        Object.entries(jsonData).forEach(([key, value]) => {
            if (value > largestValue) {
                largestValue = value;
            }
        });
        return largestValue;
    }
    
    function clampLvlValues(value) {
        if (value !== "" && !isNaN(value)) {
            let numericValue = Number(value);
            return Math.min(Math.max(numericValue, 0), 150);
        } else {
            console.error("Invalid input: Value must be a non-empty number.");
            return 0;
        }
    }

    function generateOutput() {
        const filterName = $('#filterName').val().trim();
        let cleanedData = jsonData.map(rule => {
            const { id, qualityClass, showClass, ...cleanedRule } = rule;
            return cleanedRule;
        });

        return JSON.stringify({
            default_show_items: $('#defaultShowItems').is(":checked"),
            name: filterName == "" ? `UnnamedFilter${Date.now().toString()}` : filterName,
            rules: cleanedData
        }, null, 2);
    }

    function sanitizeFilterName(name) {
        return name.replace(/[^a-zA-Z0-9\s\-_]/g, "");
    }

    function updateLoadDropdown() {
        const loadDropdown = $('#loadFromLocalStorage');
        loadDropdown.empty();
    
        loadDropdown.append('<option hidden disabled selected value>Load a filter</option>');

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            loadDropdown.append(`<option value="${key}">${key}</option>`);
        }

        $('#loadFromLocalStorage').val("");
        $('#loadFromLocalStorage option[value=""]').prop('selected', true);
    }

    function showToast(message, autoRemove = false) {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.classList.add('toast-container');
            document.body.appendChild(container);
        }
    
        const toast = document.createElement("div");
        toast.classList.add("notification", "is-small");
        toast.innerText = message;
    
        $(toast).on('click', () => {
            fadeOutAndRemove(toast);
        });

        if (autoRemove) {
            setTimeout(() => {
                fadeOutAndRemove(toast);
            }, 2500);
        } else {
            toast.classList.add("is-warning");
            toast.innerHTML += '<div style="color: white;">Click to dismiss</div>';
        }
        $('.toast-container').append(toast);
    }

    function fadeOutAndRemove(toast) {
        toast.style.opacity = 0;
        setTimeout(() => {
            toast.remove();
        }, 500);
    }

    addSortables();
    updateLoadDropdown();
});