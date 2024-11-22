// Initial JSON structure
let jsonData = {
    "default_show_items": true,
    "name": "New filter",
    "rules": []
};

// Show/hide input elements based on selected radio
function switchInput(index, type) {
    const selectInput = document.querySelector(`#selectInput${index}`);

    if (type === 'null') {
        selectInput.style.display = 'none';
    } else {
        selectInput.style.display = 'inline-block';
    }
    renderSingleRule(index)
}

function createInput(type, index) {
    const inputElem = document.createElement("input");
    const datalistElem = document.createElement("datalist");
    inputElem.classList.add("input-item-type");
    
    inputElem.id = `selectInput${index}`;
    inputElem.autocomplete = "off";
    inputElem.setAttribute("onchange", `updateParamValue(${index}, this)`);
    inputElem.lazyLoading = true;
    inputElem.multiple = true;

    // Constants for batching
    const batchSize = 4000; // Number of options to load at a time
    let currentIndex = 0; // Tracks the current position in the dataset

    function loadBatch(dataSource, datalist) {
        // Load a batch of options into the datalist
        const keys = Object.keys(dataSource);
        const batch = keys.slice(currentIndex, currentIndex + batchSize);
        batch.forEach(item => {
            const option = document.createElement("option");
            option.value = item;
            datalist.appendChild(option);
        });
        currentIndex += batchSize;
    }

    switch (type){
        case "null":
            return;
        case "code":
            inputElem.setAttribute("list", "itemCodesList");
            inputElem.setAttribute("placeholder", "Arcane Crystal");
            inputElem.value = Object.keys(itemCodes).find(key => itemCodes[key] === jsonData.rules[index].params?.code) || "";
            datalistElem.id = "itemCodesList";
            datalistElem.style.overflowY = "scroll";
            loadBatch(itemCodes, datalistElem);

            inputElem.addEventListener("input", () => {
                // Filter datalist options based on input
                const query = inputElem.value.toLowerCase();
                const filteredKeys = Object.keys(itemCodes).filter(key =>
                    key.toLowerCase().includes(query)
                );

                // Clear and reload options with filtered results
                datalistElem.innerHTML = "";
                
                currentIndex = 0; // Reset index for filtered results
                loadBatch(
                    Object.fromEntries(filteredKeys.map(key => [key, itemCodes[key]])),
                    datalistElem
                );
            });

            inputElem.appendChild(datalistElem);
            return inputElem;
        case "class":
            inputElem.setAttribute("list", "itemTypesList");
            inputElem.placeholder = "Gold";
            inputElem.value = Object.keys(itemTypes).find(key => itemTypes[key] === jsonData.rules[index].params?.class) || "";
            datalistElem.id = "itemTypesList";

            Object.keys(itemTypes).forEach(itemType => {
                const option = document.createElement("option");
                option.value = itemType;
                option.innerText = itemType;
                datalistElem.appendChild(option);
            });

            inputElem.appendChild(datalistElem);
            return inputElem;
    }
}

function getSelectedRuleType(rule) {
    if (!rule.params) return "null";
    if ('code' in rule.params) return "code";
    if ('class' in rule.params) return "class";
    return "null";
}

// Toggle the collapse state of a rule
function toggleCollapse(index) {
    jsonData.rules[index].collapsed = !jsonData.rules[index].collapsed;
    renderSingleRule(index);
}

function toggleAllCollapse() {
    const shouldCollapse = (document.getElementById("collapse-all").innerText == "collapse_content");
    if (jsonData.rules && jsonData.rules.length > 0) {
        // Check the current state of the first rule's collapsed property
        
        // Loop through all the rules and set the collapsed state accordingly
        for (let i = 0; i < jsonData.rules.length; i++) {
            jsonData.rules[i].collapsed = shouldCollapse; // Set collapsed to true or false
            renderSingleRule(i); // Call the render function to update the UI (if needed)
        }
    }
    document.getElementById("collapse-all").innerText = shouldCollapse ? 'expand_content' : 'collapse_content';
}

function getRuleDescription(index) {
    let returnValue = "";
    
    const rule = jsonData.rules[index];
    const itemQuality = getItemQualityText(rule);
    const itemType = getItemTypeText(rule);

    returnValue += rule.active ? "" : "# ";
    returnValue += rule.show_item ? "show " : "hide ";
    returnValue += rule.ethereal === 1 ? "eth " : "";
    returnValue += itemQuality != "" ? `${itemQuality.toLowerCase()} ` : "";
    returnValue += itemType != "" ? `"${itemType}" ` : "";

    return returnValue;
}

function updateIntermediateContent() {
    const intermediateContainer = document.getElementById('intermediate');
    const lineCounter = document.getElementById('lineCounter');
    let imText = "";
    let lineCount = "";

    jsonData.rules.forEach((_, index) => {
        lineCount += `${index+1}: \n`
        imText += `${getRuleDescription(index)}\n`;
    });

    lineCounter.innerText = lineCount;;
    intermediateContainer.innerText = imText;
}

function renderSingleRule(index) {
    const rulesContainer = document.getElementById('rulesContainer');
  
    // Remove any existing instance of the rule at the given index
    removeExistingRule(rulesContainer, index);

    const rule = jsonData.rules[index];
    ensureRuleDefaults(rule);

    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'rule-item';
    ruleDiv.dataset.index = index;

    // Rule status colors
    const { isRuleShownColor, isRuleActiveColor } = getRuleColors(rule);

    // Generate rule descriptor
    ruleDiv.innerHTML = createRuleDescriptor(index, rule, isRuleActiveColor, isRuleShownColor);

    // If the rule is not collapsed, render additional inputs
    if (!rule.collapsed) {
        ruleDiv.innerHTML += createRuleInputs(index, rule);
    }

    // Insert the new rule into the container
    rulesContainer.insertBefore(ruleDiv, rulesContainer.children[index]);

    // Render the correct input for the selected param type
    renderParamInput(rule, index);
    updateIntermediateContent()
}

// Function to remove the existing rule at the given index
function removeExistingRule(rulesContainer, index) {
    if (rulesContainer.children[index]) {
        rulesContainer.removeChild(rulesContainer.children[index]);
    }
}

// Function to ensure the rule has default values
function ensureRuleDefaults(rule) {
    if (rule.collapsed === undefined) {
        rule.collapsed = false; // Default to expanded
    }
}

function getRuleColors(rule) {
    const isRuleShownColor = rule.show_item ? "var(--green)" : "var(--red)";
    const isRuleActiveColor = rule.active ? "var(--green)" : "var(--red)";
    return { isRuleShownColor, isRuleActiveColor };
}

function createRuleDescriptor(index, rule, isRuleActiveColor, isRuleShownColor) {
    const ruleStatusBadge = createRuleStatusBadge(rule, isRuleActiveColor);
    const itemTypeText = getItemTypeText(rule);
    const itemQualityText = getItemQualityText(rule);

    const mapIcon = rule.automap ? `
        <span class="material-symbols-outlined" style="color: var(--green);">
            map
        </span>
    ` : "";

    const alertIcon = rule.notify ? `
        <span class="material-symbols-outlined" style="color: var(--green);">
            notifications_active
        </span>
    ` : "";

    return `
        <h3 class="rule-descriptor" style="cursor: move;">
            <div style="display: flex; justify-content: space-between; width: 100%;">
                <div style="flex-grow: 1;font-weight:500;">
                    ${ruleStatusBadge}#${index + 1}: 
                    <span style="color: ${isRuleShownColor}; margin-left: 5px; margin-right: 5px;">
                        ${rule.show_item ? "Show" : "Hide"}
                    </span>
                    ${itemQualityText}
                    ${itemTypeText}
                </div>
                <!-- Icon container aligned to the right -->
                <div style="display: flex;">
                    ${alertIcon}
                    ${mapIcon}
                    <span class="material-symbols-outlined collapse-button" onclick="toggleCollapse(${index})">
                        ${rule.collapsed ? 'expand_content' : 'collapse_content'}
                    </span>
                </div>
            </div>
        </h3>
    `;
}

function createRuleStatusBadge(rule, isRuleActiveColor) {
    return `
        <span style="padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.85em;
            margin-right: 5px;
            background-color: ${isRuleActiveColor};">
            ${rule.active ? "ACTIVE" : "DISABLED"}</span>
    `;
}

function createMapStatusBadge(rule, isShownOnMap) {
    return `
        <span class="material-symbols-outlined"
            style="color:'#a6dfb6'">
            map
        </span>
    `;
}

function getItemTypeText(rule) {
    if (!rule.params) return '';

    const paramType = Object.keys(rule.params)[0];
    if (paramType === "class") {
        return (Object.entries(itemTypes).find(([key, value]) => value === rule.params[paramType])?.[0] || '');
    } else {
        return (Object.entries(itemCodes).find(([key, value]) => value === rule.params[paramType])?.[0] || '');
    };
}

function getItemQualityText(rule) {
    const matchedQuality = Object.entries(itemQuality).find(([key, value]) => value === rule.item_quality)?.[0];
    return matchedQuality === "Any" ? "" : matchedQuality || "Unknown";
}

function createRuleInputs(index, rule) {
    return `
        <label for="active${index}">Active: </label>
        <input id="active${index}" name="active" type="checkbox" ${rule.active ? 'checked' : ''} onchange="updateRule(${index}, 'active', this.checked)">
        
        <label for="show_item${index}">Show Item: </label>
        <input id="show_item${index}" type="checkbox" ${rule.show_item ? 'checked' : ''} onchange="updateRule(${index}, 'show_item', this.checked)">
        
        <label for="notify${index}">Notify: </label>
        <input id="notify${index}" type="checkbox" ${rule.notify ? 'checked' : ''} onchange="updateRule(${index}, 'notify', this.checked)">
        
        <label for="automap${index}">Show on map: </label>
        <input id="automap${index}" type="checkbox" ${rule.automap ? 'checked' : ''} onchange="updateRule(${index}, 'automap', this.checked)">

        <label for="ethereal${index}">Ethereal:</label>
        <select id="ethereal${index}" onchange="updateRule(${index}, 'ethereal', this.value)">
            ${Object.entries(etherealState).map(([key, value]) => `
                <option value="${value}" ${rule.ethereal === value ? 'selected' : ''}>${key}</option>
            `).join('')}
        </select>

        <label for="item_quality${index}">Item Quality:</label>
        <select id="item_quality${index}" value=${Object.entries(itemQuality).find(([key, value]) => (value === rule.item_quality ? key : -1))[1]} onchange="updateRule(${index}, 'item_quality', this.value)">
            ${Object.entries(itemQuality).map(([key, value]) => `<option ${value === rule.item_quality ? "selected" : ""} value="${value}">${key}</option>`).join('')}
        </select>

        <label for="min_ilvl${index}">Min ILVL: </label>
        <input id="min_ilvl${index}" type="number" value="${rule.min_ilvl}" onchange="updateRule(${index}, 'min_ilvl', this.value)">

        <label for="max_ilvl${index}">Max ILVL: </label>
        <input id="max_ilvl${index}" type="number" value="${rule.max_ilvl}" onchange="updateRule(${index}, 'max_ilvl', this.value)">

        <label for="min_clvl${index}">Min CLVL: </label>
        <input id="min_clvl${index}" type="number" value="${rule.min_clvl}" onchange="updateRule(${index}, 'min_clvl', this.value)">
        
        <label for="max_clvl${index}">Max CLVL: </label>
        <input id="max_clvl${index}" type="number" value="${rule.max_clvl}" onchange="updateRule(${index}, 'max_clvl', this.value)">

        <div class="params-section">
            ${createParamRadioButtons(index, rule)}
        </div>
        <span id="paramInputWrapper${index}" class="paramInputWrapper"></span>

        <div class="move-buttons">
            <button class="delete-button" onclick="removeRule(${index})">Delete</button>
        </div>
    `;
}

function createParamRadioButtons(index, rule) {
    return `
        <label>None <input type="radio" name="paramType${index}" value="null" ${getSelectedRuleType(rule) == "null" ? 'checked' : ''} onchange="updateParamType(${index}, 'null')"></label>
        <label>Item <input type="radio" name="paramType${index}" value="code" ${getSelectedRuleType(rule) == "code" ? 'checked' : ''} onchange="updateParamType(${index}, 'code')"></label>
        <label>Category <input type="radio" name="paramType${index}" value="class" ${getSelectedRuleType(rule) == "class" ? 'checked' : ''} onchange="updateParamType(${index}, 'class')"></label>
    `;
}

function renderParamInput(rule, index) {
    const ruleType = getSelectedRuleType(rule);

    if (!rule.collapsed) {
        const paramWrapper = document.getElementById(`paramInputWrapper${index}`);
        if (paramWrapper) {
            const paramInput = createInput(ruleType, index);
            if (paramInput) {
                paramWrapper.appendChild(paramInput);
                
                const paramType = rule.params ? Object.keys(rule.params)[0] : null;
                if (rule.params) {
                    paramInput.value = getItemTypeText(rule);
                }

                // Do not override rule_type for "null"
                if (ruleType !== "null") {
                    rule.rule_type = ruleType === "code" ? 1 : 0;
                }
            }
        }
    }
}

function renderRules() {
    const rulesContainer = document.getElementById('rulesContainer');
    rulesContainer.innerHTML = '';

    jsonData.rules.forEach((_, index) => {
        renderSingleRule(index);
    });
}

function updateRule(index, key, value) {
    const numericValue = typeof value === 'string' ? Number(value) : value;

    if (['min_ilvl', 'max_ilvl', 'min_clvl', 'max_clvl'].includes(key)) {
        jsonData.rules[index][key] = Math.min(Math.max(numericValue, 0), 150);
    } else {
        jsonData.rules[index][key] = numericValue;
    }
    renderSingleRule(index);
}
  
function updateParamType(index, type) {
    const rule = jsonData.rules[index];
    
    if (type === "null") {
        rule.params = null;
        rule.rule_type = -1;
    } else {
        const paramKey = type === "class" ? "class" : "code";
        rule.params = { [paramKey]: 0 };
        rule.rule_type = type === "class" ? 0 : 1;
    }
    
    renderSingleRule(index);

    const paramWrapper = document.getElementById(`paramInputWrapper${index}`);
    while (paramWrapper.firstChild) {
        paramWrapper.removeChild(paramWrapper.lastChild);
    }

    const inputEl = createInput(type, index);
    if (inputEl != null){
        paramWrapper.appendChild(inputEl)
    }
}

// Update parameter value based on the selected input type
function updateParamValue(index, inputElement) {
    const value = inputElement.value; 
    const rule = jsonData.rules[index];
    const paramType = rule.params ? Object.keys(rule.params)[0] : null;

    if (paramType === "class") {
        rule.params[paramType] = itemTypes[value] || 0;
    } else if (paramType === "code") {
        rule.params[paramType] = itemCodes[value] || 0;
    } else {
        rule.params = null;
    }

    renderSingleRule(index);
}

function removeRule(index) {
    if (index >= 0 && index < jsonData.rules.length) {
        jsonData.rules.splice(index, 1)
        renderRules();
    }
    updateIntermediateContent()
}

function addRule() {
    const newRule = {
        id: Date.now(),
        "active": true,
        "automap": true,
        "ethereal": 0,
        "item_quality": -1,
        "max_clvl": 0,
        "max_ilvl": 0,
        "min_clvl": 0,
        "min_ilvl": 0,
        "notify": true,
        "params": { class: 0 },
        "rule_type": 0,
        "show_item": true,
        "collapsed": false
    };
    jsonData.rules.unshift(newRule);
    renderRules();
}

function cleanRules(rule) {
    return {
        active: rule.active,
        automap: rule.automap,
        ethereal: rule.ethereal,
        item_quality: rule.item_quality,
        max_clvl: rule.max_clvl,
        max_ilvl: rule.max_ilvl,
        min_clvl: rule.min_clvl,
        min_ilvl: rule.min_ilvl,
        notify: rule.notify,
        params: rule.params,
        rule_type: rule.rule_type,
        show_item: rule.show_item
    };
}

function generateOutput() {
    const cleanedRules = jsonData.rules.map(cleanRules);
    const filterName = document.getElementById('filterName').value.trim()

    document.getElementById('output').textContent = JSON.stringify({
        default_show_items: document.getElementById('defaultShowItems').checked,
        name: filterName == "" ? `UnnamedFilter${Date.now().toString()}` : filterName,
        rules: cleanedRules
    }, null, 2);
}


// Copy to clipboard function
function copyToClipboard() {
    const outputText = document.getElementById('output').textContent;
    navigator.clipboard.writeText(outputText)
        .then(() => showToast("Filter copied to clipboard!", true))
        .catch(err => showToast("Failed to copy: " + err));
}

// Paste from clipboard function with fallback
async function pasteFromClipboard() {
    try {
        let text;
        // Fallback for browsers without clipboard API support
        text = prompt("Please paste the JSON data here:");
        if (!text) {
            showToast("No data pasted.");
            return;
        }

        const data = JSON.parse(text);

        // Validate and update jsonData
        if (data && typeof data === "object" && data.rules) {
            jsonData = data;
            document.getElementById('defaultShowItems').checked = jsonData.default_show_items;
            document.getElementById('filterName').value = jsonData.name;
            
            data.rules.forEach(rule => {rule.collapsed = true;});
            renderRules();
        } else {
            showToast("Invalid JSON format.");
        }
    } catch (error) {
        showToast("Failed to paste: " + error);
    }
}

function populateDatalist() {
    // Populate the datalist with itemTypes
    let datalist = document.getElementById('itemTypesList');
    Object.entries(itemTypes).forEach(([key, value]) => {
        let option = document.createElement('option');
        option.value = key; // Shows the name, but can use value for actual usage
        datalist.appendChild(option);
    });
}

function populateCodeslist() {
    // Populate the datalist with itemTypes
    let datalist = document.getElementById('itemCodesList');
    Object.entries(itemCodes).forEach(([key, value]) => {
        let option = document.createElement('option');
        option.value = key; // Shows the name, but can use value for actual usage
        datalist.appendChild(option);
    });
}

function addSortables() {
    const rulesContainer = document.getElementById('rulesContainer');
    
    new Sortable(rulesContainer, {
        handle: 'h3', // Drag handle
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function () {
            // Create a new sorted list based on current DOM order
            const newOrder = Array.from(rulesContainer.children).map(ruleItem => {
                const originalIndex = ruleItem.dataset.index;
                return jsonData.rules[originalIndex];
            });

            // Reorder jsonData.rules based on the new DOM order
            jsonData.rules = newOrder;

            // Re-render the rules to reflect the new order
            renderRules();
        }
    });
}

function addEventsToHeaderButtons() {
    const addRuleButton = document.getElementById("addRule");
    addRuleButton.addEventListener("click", () => {
        addRule();
    });

    const pasteFromClipboardButton = document.getElementById("pasteFromClipboard");
    pasteFromClipboardButton.addEventListener("click", () => {
        pasteFromClipboard();
    });

    const generateOutputButton = document.getElementById("generateOutput");
    generateOutputButton.addEventListener("click", () => {
        generateOutput();
    });

    const copyToClipboardButton = document.getElementById("copyToClipboard");
    copyToClipboardButton.addEventListener("click", () => {
        copyToClipboard();
    });
}


// Function to create and show a toast message
function showToast(message, autoRemove = false) {
    // Create a container for the toast if it doesn't exist
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.classList.add('toast-container');
        document.body.appendChild(container);
    }

    // Create the toast message element
    const toast = document.createElement('div');
    toast.classList.add('toast-message');
    toast.innerText = message;

    // Add event listener for the close button to remove the toast when clicked
    toast.addEventListener('click', () => {
        fadeOutAndRemove(toast);
    });

    // If autoRemove is true, the toast will disappear automatically after 2.5 seconds
    if (autoRemove) {
        setTimeout(() => {
            fadeOutAndRemove(toast);
        }, 2500); // Show for 2.5 seconds
    } else {
        // Change background color or add a label to show that it requires manual removal
        toast.classList.add('manual-close-toast');
        toast.innerHTML += '<div class="manual-toast-label">Click to dismiss</div>';
    }

    // Append the toast to the container
    document.querySelector('.toast-container').appendChild(toast);
}

// Function to fade out and remove the toast after the animation
function fadeOutAndRemove(toast) {
    toast.style.opacity = 0;
    setTimeout(() => {
        toast.remove();
    }, 500); // Match the duration of the fade-out animation
}


window.onload = function() {
    addEventsToHeaderButtons();
    renderRules();
    addSortables();
}