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
    inputElem.classList.add("input-item-type");

    switch (type){
        case "null":
            return;
        case "code":
            inputElem.id = `selectInput${index}`;
            inputElem.type = "number";
            inputElem.value = jsonData.rules[index].params?.code || 0;
            inputElem.setAttribute("onchange", `updateParamValue(${index}, this)`);

            return inputElem;
        case "class":
            const datalistElem = document.createElement("datalist");
            inputElem.id = `selectInput${index}`;
            inputElem.setAttribute("list", "itemTypesList");
            inputElem.value = Object.keys(itemTypes).find(key => itemTypes[key] === jsonData.rules[index].params?.class) || "";
            inputElem.setAttribute("onchange", `updateParamValue(${index}, this)`);
            
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

// Function to get the rule colors based on the show and active status
function getRuleColors(rule) {
    const isRuleShownColor = rule.show_item ? "var(--green)" : "red";
    const isRuleActiveColor = rule.active ? "var(--green)" : "red";
    return { isRuleShownColor, isRuleActiveColor };
}

// Function to generate the rule descriptor HTML
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
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="flex-grow: 1;">
                    ${ruleStatusBadge}#${index + 1}: 
                    <span style="color: ${isRuleShownColor}; margin-left: 5px; margin-right: 5px;">
                        ${rule.show_item ? "Show" : "Hide"}
                    </span>
                    ${itemQualityText}
                    ${itemTypeText}
                </div>
                <!-- Icon container aligned to the right -->
                <div style="display: flex; align-items: center;">
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


// Function to create the rule status badge
function createRuleStatusBadge(rule, isRuleActiveColor) {
    return `
        <span style="padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.85em;
            margin-right: 5px;
            background-color: ${isRuleActiveColor};
            color: ${rule.active ? '#a6dfb6' : '#f8d7da'};">${rule.active ? "ACTIVE" : "DISABLED"}</span>
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

// Function to determine the item type text
function getItemTypeText(rule) {
    //Early return for param.none
    if (!rule.params) return '';

    const paramType = Object.keys(rule.params)[0];
    if (paramType === "class") {
        return (Object.entries(itemTypes).find(([key, value]) => value === rule.params[paramType])?.[0] || '');
    } else {
        return `ID-${rule.params[paramType]}`;
    };
}

// Function to get the item quality text
function getItemQualityText(rule) {
    const matchedQuality = Object.entries(itemQuality).find(([key, value]) => value === rule.item_quality)?.[0];
    return matchedQuality === "Any" ? "" : matchedQuality || "Unknown";
}

// Function to create the input fields for the rule
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
        <span id="paramInputWrapper${index}"></span>

        <div class="move-buttons">
            <button class="delete-button" onclick="removeRule(${index})">Delete</button>
        </div>
    `;
}

// Function to create the radio buttons for the parameters
function createParamRadioButtons(index, rule) {
    return `
        <label><input type="radio" name="paramType${index}" value="null" ${getSelectedRuleType(rule) == "null" ? 'checked' : ''} onchange="updateParamType(${index}, 'null')"> None</label>
        <label><input type="radio" name="paramType${index}" value="code" ${getSelectedRuleType(rule) == "code" ? 'checked' : ''} onchange="updateParamType(${index}, 'code')"> Item</label>
        <label><input type="radio" name="paramType${index}" value="class" ${getSelectedRuleType(rule) == "class" ? 'checked' : ''} onchange="updateParamType(${index}, 'class')"> Category</label>
    `;
}

// Function to render the correct parameter input based on the rule type
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
                    paramInput.value = (paramType === "class") 
                        ? getItemTypeText(rule) 
                        : rule.params[paramType];
                }

                // Do not override rule_type for "null"
                if (ruleType !== "null") {
                    rule.rule_type = ruleType === "code" ? 1 : 0;
                }
            }
        }
    }
}



// Render all rules in the `rulesContainer`
function renderRules() {
    const rulesContainer = document.getElementById('rulesContainer');
    rulesContainer.innerHTML = ''; // Clear the container before rendering

    // Loop through each rule and render it individually
    jsonData.rules.forEach((_, index) => {
        renderSingleRule(index);
    });
}

// Toggle specific rule properties based on inputs (with clamping for ilvl and clvl)
function updateRule(index, key, value) {
    // Convert value to a number if it's for a numerical field
    const numericValue = typeof value === 'string' ? Number(value) : value;

    // Apply clamping for specific fields
    if (['min_ilvl', 'max_ilvl', 'min_clvl', 'max_clvl'].includes(key)) {
        jsonData.rules[index][key] = Math.min(Math.max(numericValue, 0), 150);
    } else {
        jsonData.rules[index][key] = numericValue;
    }
    renderSingleRule(index);
}
  
// Update parameter type and re-render the input type accordingly
function updateParamType(index, type) {
    const rule = jsonData.rules[index];
    
    if (type === "null") {
        rule.params = null;
        rule.rule_type = -1; // Explicitly set to -1 for "None"
    } else {
        const paramKey = type === "class" ? "class" : "code";
        rule.params = { [paramKey]: 0 }; // Initialize with default value 0
        rule.rule_type = type === "class" ? 0 : 1; // Set rule_type based on type
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
        // Map the selected text (e.g., "Gold") to its corresponding value in itemTypes
        rule.params[paramType] = itemTypes[value] || 0;
    } else if (paramType === "code") {
        rule.params[paramType] = Math.max(Number(value), 1);
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
}

function addRule() {
    const newRule = {
        id: Date.now(), // Unique ID based on timestamp
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
        "collapsed": false // Set collapsed to false by default
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

    document.getElementById('output').textContent = JSON.stringify({
        default_show_items: document.getElementById('defaultShowItems').checked,
        name: document.getElementById('filterName').value,
        rules: cleanedRules
    }, null, 2);
}


// Copy to clipboard function
function copyToClipboard() {
    const outputText = document.getElementById('output').textContent;
    navigator.clipboard.writeText(outputText)
        .then(() => alert("Filter copied to clipboard!"))
        .catch(err => alert("Failed to copy: " + err));
}

// Paste from clipboard function with fallback
async function pasteFromClipboard() {
    try {
        let text;
        // Fallback for browsers without clipboard API support
        text = prompt("Please paste the JSON data here:");
        if (!text) {
            alert("No data pasted.");
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
            alert("Invalid JSON format.");
        }
    } catch (error) {
        alert("Failed to paste: " + error);
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


window.onload = function() {
    addEventsToHeaderButtons();
    renderRules();
    addSortables();
}