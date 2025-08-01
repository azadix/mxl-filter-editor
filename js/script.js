import { 
    toastManager,
    ruleManager,
    filterEncoder,
    completeInitialization,
    intializeFilterEncoder
} from './globals.js';

import { loadJsonData, applySharedFilter, fetchFilterFromAPI } from './modules/utils.js';

const dataConfigs = [
    { path: './data/items.json', shouldSort: true, shouldClean: true,  method: 'loadItemCodes' },
    { path: './data/item_classes.json', shouldSort: true, method: 'loadItemClasses' },
    { path: './data/item_quality.json', shouldSort: false, method: 'loadItemQuality' },
    { path: './data/item_name_overrides.json', shouldSort: false, method: 'loadItemNameOverrides' },
    { path: './data/item_hide_list.json', shouldSort: false, method: 'loadItemHideList' }
];

async function initializeApp() {
    try {
        // Load all data files in parallel
        await Promise.all(dataConfigs.map(config => 
            loadJsonData(
                config.path, 
                config.shouldSort, 
                config.shouldClean,
                config.method, 
                ruleManager,
                toastManager
            )
        ));

        // Apply name overrides to item codes
        ruleManager.processItems();

        // Get all URL parameters
        const params = new URLSearchParams(window.location.search);
        let filterApplied = false;

        for (const [key, value] of params.entries()) {
            switch (key) {
                case 'id':
                    try {
                        const apiTSW = `https://tsw.vn.cz/filters/?mode=api&id=${value}`;
                        const apiFilter = await fetchFilterFromAPI(apiTSW);
                        if (apiFilter) {
                            applySharedFilter(apiFilter, ruleManager, toastManager);
                            filterApplied = true;
                        }
                    } catch (error) {
                        toastManager.showToast(`Failed to load filter id:=${value} from Filter Exchange API`, false, 'danger');
                        console.error('API load error:', error);
                    }
                    break;
                    
                case 'filter':
                    // Only process if we haven't already applied a filter from 'id'
                    if (!filterApplied) {
                        intializeFilterEncoder();
                        const sharedFilter = filterEncoder.loadFromShortenedLink(value);
                        if (sharedFilter) {
                            applySharedFilter(sharedFilter, ruleManager, toastManager);
                            filterApplied = true;
                        }
                    }
                    break;
            }
        }

        // Complete initialization with table-related managers
        intializeFilterEncoder();
        await completeInitialization();

    } catch (error) {
        toastManager.showToast(`Failed to initialize application: ${error.message}`, false, 'danger');
        console.error('Initialization error:', error);
    }
}

$(document).ready(() => {
    initializeApp();
});