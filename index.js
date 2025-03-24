import { RuleManager } from './modules/RuleManager.js';
import { StorageManager } from './modules/StorageManager.js';
import { ToastManager } from './modules/ToastManager.js';
import { DropdownManager } from './modules/DropdownManager.js';
import { TableManager } from './modules/TableManager.js';
import { loadJsonData } from './modules/utils.js';

$(document).ready(function () {
    const ruleManager = new RuleManager();
    const storageManager = new StorageManager();
    const toastManager = new ToastManager();
    const dropdownManager = new DropdownManager(storageManager);
    const tableManager = new TableManager(ruleManager, storageManager, toastManager, dropdownManager);

    loadJsonData('./data/file_parser/itemCode.json', true, 'loadItemCodes', ruleManager);
    loadJsonData('./data/itemClass.json', true, 'loadItemClasses', ruleManager);
    loadJsonData('./data/itemQuality.json', false, 'loadItemQuality', ruleManager);
});