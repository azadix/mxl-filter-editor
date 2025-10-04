import { 
    ruleManager, 
    toastManager, 
    filterEncoder, 
    tableManager,
    storageManager,
    tableRenderer
} from '../globals.js';

export function clampLvlValues(value) {
    const numericValue = Number(value);
    return !isNaN(numericValue) && value !== "" ? Math.min(Math.max(numericValue, 0), 150) : 0;
}

export function sanitizeFilterName(name) {
    return name.replace(/[^a-zA-Z0-9\s\-_]/g, "");
}

export function loadJsonData(filePath, shouldSort, shouldClean, loaderMethod, manager, toastManager) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: filePath,
            dataType: 'json',
            success: function(data) {
                try {
                    if (shouldClean) {
                        data = cleanItemNames(data);
                    }
                    
                    if (shouldSort && typeof data === 'object' && data !== null) {
                        // Create a new object to store sorted data
                        const sortedData = {};
                        
                        // Get sorted entries
                        const entries = Object.entries(data)
                            .sort(([keyA, valueA], [keyB, valueB]) => {
                                return valueA.localeCompare(valueB, undefined, { 
                                    sensitivity: 'base',
                                    numeric: true 
                                });
                            });
                        
                        data = entries;
                    }
                    
                    manager[loaderMethod](data);
                    resolve();
                } catch (error) {
                    reject(new Error(`Error processing ${filePath}: ${error.message}`));
                }
            },
            error: function(xhr, status, error) {
                const fileName = filePath.split('/').pop();
                const errorMsg = `Error loading ${fileName}: ${error}`;
                
                if (toastManager) {
                    toastManager.showToast(errorMsg, false, 'danger');
                }
                reject(new Error(errorMsg));
            }
        });
    });
}

function cleanItemNames(data) {
    if (typeof data !== 'object' || data === null) return data;
    
    const cleanedData = {};
    const spanRegex = /<span[^>]*>(.*?)<\/span>/gi;
    
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            // Remove span tags but keep their content
            cleanedData[key] = value.replace(spanRegex, '$1').trim();
        } else {
            cleanedData[key] = value;
        }
    }
    
    return cleanedData;
}

export function applySharedFilter(sharedFilter, ruleManager, toastManager) {
    try {
        $('#defaultShowItems').prop('checked', sharedFilter.default_show_items);
        $('#filterName').val(sharedFilter.name);
        ruleManager.clearRules();
        sharedFilter.rules.reverse().forEach(rule => ruleManager.addRule(rule));
        tableRenderer.render();
        toastManager.showToast(`Filter '${sharedFilter.name}' loaded!`, true);
        return true;
    } catch (e) {
        toastManager.showToast('Error while loading filter from URL:' + e.message, false, 'danger');
        return false;
    }
}

export async function fetchFilterFromAPI(apiUrl) {
    try {        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API fetch error:', error);
        throw error;
    }
}

export function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

export function loadFilterFromStorage(filterName, ruleManager, tableRenderer, toastManager) {
    if (!filterName) {
        toastManager.showToast("Please select a filter to load.", true);
        return false;
    }
    
    const filterData = storageManager.loadFilter(filterName);
    if (filterData) {
        const parsedData = JSON.parse(filterData);
        $('#defaultShowItems').prop('checked', parsedData.default_show_items);
        $('#filterName').val(filterName);

        ruleManager.clearRules();
        parsedData.rules.reverse().forEach(rule => ruleManager.addRule(rule));
        tableRenderer.render();
        
        toastManager.showToast(`Filter "${filterName}" loaded successfully!`, true);
        return true;
    } else {
        toastManager.showToast(`Filter "${filterName}" not found.`, true);
        return false;
    }
}