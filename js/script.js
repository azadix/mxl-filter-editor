import { RuleManager } from './modules/RuleManager.js';
import { StorageManager } from './modules/StorageManager.js';
import { ToastManager } from './modules/ToastManager.js';
import { DropdownManager } from './modules/DropdownManager.js';
import { TableManager } from './modules/TableManager.js';
import { loadJsonData, loadFromShortenedLink, initShareFilterButton } from './modules/utils.js';

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

        // Check for shared filter in URL
        const sharedFilter = loadFromShortenedLink();
        if (sharedFilter) {
            try {
                const parsedData = JSON.parse(sharedFilter);
                $('#defaultShowItems').prop('checked', parsedData.default_show_items);
                $('#filterName').val(parsedData.name);
                ruleManager.clearRules();
                parsedData.rules.reverse().forEach(rule => ruleManager.addRule(rule));
                
                toastManager.showToast('Shared filter loaded!', true);
            } catch (e) {
                toastManager.showToast('Invalid shared filter', false, 'danger');
            }
        }

        // Initialize table and UI
        const tableManager = new TableManager(
            ruleManager, 
            storageManager, 
            toastManager, 
            dropdownManager
        );


        // Add share button to UI
        initShareFilterButton(toastManager, ruleManager);

        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.substring(1);
            if (newHash) {
                const sharedFilter = loadFromShortenedLink();
                if (sharedFilter) {
                    try {
                        const parsedData = JSON.parse(sharedFilter);
                        $('#defaultShowItems').prop('checked', parsedData.default_show_items);
                        $('#filterName').val(parsedData.name);
                        ruleManager.clearRules();
                        parsedData.rules.reverse().forEach(rule => ruleManager.addRule(rule));
                        toastManager.showToast('Shared filter loaded!', true);
                        tableManager.tableRenderer.render();
                    } catch (e) {
                        toastManager.showToast('Invalid shared filter', false, 'danger');
                    }
                }
            }
        });

    } catch (error) {
        toastManager.showToast(`Failed to initialize application: ${error.message}`, false, 'danger');
        console.error('Initialization error:', error);
    }
}

$(document).ready(() => {
    initializeApp();
});