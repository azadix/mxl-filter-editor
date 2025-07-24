import { 
    toastManager,
    ruleManager,
    filterEncoder,
    completeInitialization
} from './globals.js';

import { loadJsonData, applySharedFilter, initHashChangeListener, getUrlParameter, fetchFilterFromAPI } from './modules/utils.js';

const dataConfigs = [
    { path: './data/itemCode.json', isSorted: true, method: 'loadItemCodes' },
    { path: './data/itemClass.json', isSorted: true, method: 'loadItemClasses' },
    { path: './data/itemQuality.json', isSorted: false, method: 'loadItemQuality' }
];

async function initializeApp() {
    try {
        // Load all data files in parallel
        await Promise.all(dataConfigs.map(config => 
            loadJsonData(
                config.path, 
                config.isSorted, 
                config.method, 
                ruleManager,
                toastManager
            )
        ));

        // Check for ID parameter first
        const filterId = getUrlParameter('id');
        if (filterId) {
            try {
                const apiFilter = await fetchFilterFromAPI(filterId);
                if (apiFilter) {
                    applySharedFilter(apiFilter, ruleManager, toastManager);
                }
            } catch (error) {
                toastManager.showToast(`Failed to load filter id:=${filterId} from Filter Exchange API`, false, 'danger');
                console.error('API load error:', error);
            }
        }
        // Then check for shared filter in URL hash
        else {
            const sharedFilter = filterEncoder.loadFromShortenedLink(window.location.hash.substring(1));
            if (sharedFilter) {
                applySharedFilter(sharedFilter, ruleManager, toastManager);
            }
        }

        // Complete initialization with table-related managers
        await completeInitialization();

        // Initialize hash change listener
        initHashChangeListener();

    } catch (error) {
        toastManager.showToast(`Failed to initialize application: ${error.message}`, false, 'danger');
        console.error('Initialization error:', error);
    }
}

$(document).ready(() => {
    initializeApp();
});