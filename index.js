import { RuleManager } from './modules/RuleManager.js';
import { StorageManager } from './modules/StorageManager.js';
import { ToastManager } from './modules/ToastManager.js';
import { DropdownManager } from './modules/DropdownManager.js';
import { TableManager } from './modules/TableManager.js';
import { loadJsonData } from './modules/utils.js';

const dataConfigs = [
    { path: './data/file_parser/itemCode.json', isSorted: true, method: 'loadItemCodes' },
    { path: './data/itemClass.json', isSorted: true, method: 'loadItemClasses' },
    { path: './data/itemQuality.json', isSorted: false, method: 'loadItemQuality' }
];

$(document).ready(function () {
    const ruleManager = new RuleManager();
    const storageManager = new StorageManager();
    const toastManager = new ToastManager();
    const dropdownManager = new DropdownManager(storageManager);
    const tableManager = new TableManager(ruleManager, storageManager, toastManager, dropdownManager);

    dataConfigs.forEach(config => loadJsonData(config.path, config.isSorted, config.method, ruleManager));
});