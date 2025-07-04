import { RuleManager } from './modules/RuleManager.js';
import { StorageManager } from './modules/StorageManager.js';
import { ToastManager } from './modules/ToastManager.js';
import { DropdownManager } from './modules/DropdownManager.js';
import { TableManager } from './modules/TableManager.js';
import { FilterEncoder } from './modules/FilterEncoder.js';
import { loadJsonData, applySharedFilter, initHashChangeListener, getUrlParameter, fetchFilterFromAPI } from './modules/utils.js';

const dataConfigs = [
    { path: './data/itemCode.json', isSorted: true, method: 'loadItemCodes' },
    { path: './data/itemClass.json', isSorted: true, method: 'loadItemClasses' },
    { path: './data/itemQuality.json', isSorted: false, method: 'loadItemQuality' }
];

async function initializeApp() {
    const toastManager = new ToastManager();
    
    try {
        // Create manager instances
        const ruleManager = new RuleManager();
        const storageManager = new StorageManager();
        const dropdownManager = new DropdownManager(storageManager);
        const filterEncoder = new FilterEncoder(ruleManager);
        
        // Load all data files sequentially
        for (const config of dataConfigs) {
            await loadJsonData(
                config.path, 
                config.isSorted, 
                config.method, 
                ruleManager,
                toastManager
            );
        }

        // Check for ID parameter first
        const filterId = getUrlParameter('id');
        if (filterId) {
            try {
                const apiFilter = await fetchFilterFromAPI(filterId);
                applySharedFilter(apiFilter, ruleManager, toastManager);
            } catch (error) {
                toastManager.showToast(`Failed to load filter from API: ${error.message}`, false, 'danger');
            }
        }
        // Then check for shared filter in URL hash
        else {
            const sharedFilter = filterEncoder.loadFromShortenedLink(window.location.hash.substring(1));
            if (sharedFilter) {
                applySharedFilter(sharedFilter, ruleManager, toastManager);
            }
        }


        // Initialize table and UI
        const tableManager = new TableManager(
            ruleManager, 
            storageManager, 
            toastManager, 
            dropdownManager
        );

        // Initialize hash change listener
        initHashChangeListener(ruleManager, toastManager, filterEncoder, tableManager);

    } catch (error) {
        toastManager.showToast(`Failed to initialize application: ${error.message}`, false, 'danger');
        console.error('Initialization error:', error);
    }
}

$(document).ready(() => {
    initializeApp();
});