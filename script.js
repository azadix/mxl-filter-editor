//TODO
//[ ] metody w js sa zadeklarowene inline a oddzielic je od htmla ( zeby byly funkcja )

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
            inputElem.setAttribute("value", 1);
            inputElem.setAttribute("onchange", `updateParamValue(${index}, this)`);
    
            return inputElem;
        case "class":
            const datalistElem = document.createElement("datalist");
            inputElem.id = `selectInput${index}`;
            inputElem.setAttribute("list", "itemTypesList");
            inputElem.setAttribute("value", "Gold");
            jsonData.rules[index].params.class = 1;

            inputElem.setAttribute("onchange", `updateParamValue(${index}, this)`);
            datalistElem.id = "itemTypesList";
            Object.keys(itemTypes).map(itemType => {
                let childItem = document.createElement("option");
                childItem.setAttribute("value", itemType);
                childItem.innerText = itemType;
                datalistElem.appendChild(childItem);
            });

            inputElem.appendChild(datalistElem);
            return inputElem;
    }
}

function getSelectedRuleType(rule) {
    let returnType;

    if (rule.params == null) {
        returnType = "null";
    } else if (rule.params && 'code' in rule.params) {
        returnType = "code";
    } else if (rule.params && 'class' in rule.params) {
        returnType = "class";
    }
    return returnType;
}

// Toggle the collapse state of a rule
function toggleCollapse(index) {
    jsonData.rules[index].collapsed = !jsonData.rules[index].collapsed;
    renderSingleRule(index);
}

function renderSingleRule(index) {
    const rulesContainer = document.getElementById('rulesContainer');
  
    // Remove any existing instance of the rule at the given index
    if (rulesContainer.children[index]) {
        rulesContainer.removeChild(rulesContainer.children[index]);
    }

    const rule = jsonData.rules[index];

    // Ensure rule has a `collapsed` property
    if (rule.collapsed === undefined) {
        rule.collapsed = false; // Default to expanded
    }

    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'rule-item';
  
    // Determine colors for rule state
    const isRuleShownColor = rule.show_item ? "var(--green)" : "red";
    const isRuleActiveColor = rule.active ? "var(--green)" : "red";

    // Descriptor for the rule, with color-coded status and badge depending if rule is active or not
    const ruleStatusBadge = `
        <span style="padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.85em;
            margin-right: 5px;
            background-color: ${isRuleActiveColor};
            color: ${rule.active ? '#a6dfb6' : '#f8d7da'};">
            ${rule.active ? "✔ " : "✘ "}
        </span>
    `;

    let itemTypeText = "";
    const paramType = rule.params ? Object.keys(rule.params)[0] : null;

    if (rule.params) {
        itemTypeText = (paramType === "class") 
    	    ? (Object.entries(itemTypes).find(([key, value]) => value === rule.params[paramType])?.[0] || 'Gold')
            : rule.params[paramType];
    }

    const matchedQuality = Object.entries(itemQuality).find(([key, value]) => value === rule.item_quality)?.[0];
    const itemQualityText = matchedQuality === "Any" ? "" : matchedQuality || "Unknown";

    const ruleDescriptor = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            ${ruleStatusBadge}#${index + 1}: <span style="color: ${isRuleShownColor}; margin-left: 5px; margin-right: 5px;"> ${rule.show_item ? "Show" : "Hide"}</span>
            ${itemQualityText}
	        ${(paramType === "class") ? itemTypeText : (paramType === "code") ? "item ID-" + rule.params[paramType] : ""}
            <span class="material-symbols-outlined collapse-button" onclick="toggleCollapse(${index})">${rule.collapsed ? 'expand_content' : 'collapse_content'}</span>
        </div>
    `;

    ruleDiv.innerHTML = `<h3>${ruleDescriptor}</h3>`;
    if (!rule.collapsed) {
        ruleDiv.innerHTML += `
            <label>Active: <input type="checkbox" ${rule.active ? 'checked' : ''} onchange="updateRule(${index}, 'active', this.checked)"></label>
            <label>Show Item: <input type="checkbox" ${rule.show_item ? 'checked' : ''} onchange="updateRule(${index}, 'show_item', this.checked)"></label>
            <label>Notify: <input type="checkbox" ${rule.notify ? 'checked' : ''} onchange="updateRule(${index}, 'notify', this.checked)"></label>
            <label>Show on map: <input type="checkbox" ${rule.automap ? 'checked' : ''} onchange="updateRule(${index}, 'automap', this.checked)"></label>
            <label>Ethereal: <input type="number" value="${rule.ethereal}" onchange="updateRule(${index}, 'ethereal', this.value)"></label>
            <label>Item Quality:</label>
            <select value=${Object.entries(itemQuality).find(([key, value]) => (value === rule.item_quality ? key : -1))[1]} onchange="updateRule(${index}, 'item_quality', this.value)">
                ${Object.entries(itemQuality).map(([key, value]) => `<option ${value === rule.item_quality ? "selected" : ""} value="${value}">${key}</option>`).join('')}
            </select>
            <label>Min ILVL: <input type="number" value="${rule.min_ilvl}" onchange="updateRule(${index}, 'min_ilvl', this.value)"></label>
            <label>Max ILVL: <input type="number" value="${rule.max_ilvl}" onchange="updateRule(${index}, 'max_ilvl', this.value)"></label>
            <label>Min CLVL: <input type="number" value="${rule.min_clvl}" onchange="updateRule(${index}, 'min_clvl', this.value)"></label>
            <label>Max CLVL: <input type="number" value="${rule.max_clvl}" onchange="updateRule(${index}, 'max_clvl', this.value)"></label>

            <h4>Params</h4>
            <div class="params-section">
                <label><input type="radio" name="paramType${index}" value="null" ${getSelectedRuleType(rule) == "null" ? 'checked' : ''} onchange="updateParamType(${index}, 'null')"> None</label>
                <label><input type="radio" name="paramType${index}" value="code" ${getSelectedRuleType(rule) == "code" ? 'checked' : ''} onchange="updateParamType(${index}, 'code')"> Item</label>
                <label><input type="radio" name="paramType${index}" value="class" ${getSelectedRuleType(rule) == "class" ? 'checked' : ''} onchange="updateParamType(${index}, 'class')"> Category</label>
            </div>
            <span id="paramInputWrapper${index}"></span>

            <div class="move-buttons">
                <button onclick="moveRule(${index}, -1)">Move Up</button>
                <button onclick="moveRule(${index}, 1)">Move Down</button>
                <button class="delete-button" onclick="removeRule(${index})">Delete</button>
            </div>
        `;
    }

    rulesContainer.insertBefore(ruleDiv, rulesContainer.children[index]);

    // Render the correct input for the selected param type
    const ruleType = getSelectedRuleType(rule)

    if (!rule.collapsed) {
        const paramWrapper = document.getElementById(`paramInputWrapper${index}`);
        if (paramWrapper) {
            const paramInput = createInput(ruleType, index);
            if (paramInput) {
                paramWrapper.appendChild(paramInput);
                
                const paramType = rule.params ? Object.keys(rule.params)[0] : null;
                if (rule.params) {
                    paramInput.value = (paramType === "class") 
                        ? itemTypeText 
                        : rule.params[paramType];
                }

                switch (ruleType) {
                    case "null":
                        rule.rule_type = -1;
                    case "code":
                        rule.rule_type = 1;
                    case "class":
                        rule.rule_type = 0;
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
    jsonData.rules[index].params = type === "null" ? null : { [type]: 0 };
    // Set default item quality text if switching to 'class' paramType
    if (type === "class" && !jsonData.rules[index].item_quality) {
        jsonData.rules[index].params.class = itemTypes["Gold"]; // Default to 'Gold'
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
    const paramType = Object.keys(jsonData.rules[index].params)[0];

    if (paramType == "class") {
        jsonData.rules[index].params[paramType] = itemTypes[value];
    } else if (paramType == "code") {
        jsonData.rules[index].params[paramType] = Math.max(Number(value), 0);
    } else {
        jsonData.rules[index].params = null;
    }

    renderSingleRule(index);
  }
  
function moveRule(index, direction) {
    const newIndex = index + direction;
    const rulesContainer = document.getElementById('rulesContainer').children;

    if (newIndex >= 0 && newIndex < jsonData.rules.length) {
    // Swap the rules in the data model
    const temp = jsonData.rules[index];
    jsonData.rules[index] = jsonData.rules[newIndex];
    jsonData.rules[newIndex] = temp;

    // Get the height of the rule item to calculate the translation distance
    const currentRuleElement = rulesContainer[index];
    const targetRuleElement = rulesContainer[newIndex];
    const moveDistance = `${currentRuleElement.offsetHeight+2}px`;

    // Set the CSS variable --move-distance for the translation
    currentRuleElement.style.setProperty('--move-distance', moveDistance);
    targetRuleElement.style.setProperty('--move-distance', moveDistance);

    // Apply animation classes
    currentRuleElement.classList.add(direction > 0 ? 'move-down' : 'move-up');
    targetRuleElement.classList.add(direction > 0 ? 'move-up' : 'move-down');

    // Remove animation classes after animation duration
    setTimeout(() => {
        currentRuleElement.classList.remove('move-up', 'move-down');
        targetRuleElement.classList.remove('move-up', 'move-down');

        // Re-render the list only after the animation finishes
        renderRules();
    }, 400); // Matches the CSS transition duration
    }
}

function removeRule(index) {
    if (index >= 0 && index < jsonData.rules.length) {
        jsonData.rules.splice(index, 1)
        renderRules();
    }
}

function addRule() {
    const newRule = {
        "active": true,
        "automap": true,
        "ethereal": 0,
        "item_quality": -1,
        "max_clvl": 0,
        "max_ilvl": 0,
        "min_clvl": 0,
        "min_ilvl": 0,
        "notify": true,
        "params": {class: 1},
        "rule_type": 0,
        "show_item": true
    }
    jsonData.rules.unshift(newRule);
    renderRules();
}

function generateOutput() {
    jsonData.default_show_items = document.getElementById('defaultShowItems').checked;
    jsonData.name = document.getElementById('name').value;
    document.getElementById('output').textContent = JSON.stringify(jsonData, null, 2);
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
            document.getElementById('name').value = jsonData.name;
            
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

window.onload = function() {
    renderRules();
}