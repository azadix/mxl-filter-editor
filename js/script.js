import { RuleManager } from './modules/RuleManager.js';
import { StorageManager } from './modules/StorageManager.js';
import { ToastManager } from './modules/ToastManager.js';
import { DropdownManager } from './modules/DropdownManager.js';
import { TableManager } from './modules/TableManager.js';
import { loadJsonData } from './modules/utils.js';

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

        // Only initialize table after all data is loaded
        const tableManager = new TableManager(
            ruleManager, 
            storageManager, 
            toastManager, 
            dropdownManager
        );        
    } catch (error) {
        toastManager.showToast(`Failed to initialize application: ${error.message}`, false, 'danger');
        console.error('Initialization error:', error);
    }
}

$(document).ready(() => {
    initializeApp();
});