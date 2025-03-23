import { RuleManager } from './modules/RuleManager.js';
import { TableManager } from './modules/TableManager.js';
import { StorageManager } from './modules/StorageManager.js';
import { ToastManager } from './modules/ToastManager.js';
import { DropdownManager } from './modules/DropdownManager.js';

$(document).ready(function () {
    const ruleManager = new RuleManager();
    const storageManager = new StorageManager();
    const toastManager = new ToastManager();
    const dropdownManager = new DropdownManager(storageManager);
    const tableManager = new TableManager(ruleManager, storageManager, toastManager, dropdownManager);

    $.ajax({
        url: './data/file_parser/itemCode.json',
        dataType: 'json',
        success: function(data) {
            data.sort((a, b) => a.name.localeCompare(b.name));
            ruleManager.loadItemCodes(data);
        },
        error: function(xhr, status, error) {
            console.error('Error loading itemCode.json:', error);
        }
    });

    $.ajax({
        url: './data/itemClass.json',
        dataType: 'json',
        success: function(data) {
            data.sort((a, b) => a.name.localeCompare(b.name));
            ruleManager.loadItemClasses(data);
        },
        error: function(xhr, status, error) {
            console.error('Error loading itemClass.json:', error);
        }
    });

    $.ajax({
        url: './data/itemQuality.json',
        dataType: 'json',
        success: function(data) {
            ruleManager.loadItemQuality(data);
        },
        error: function(xhr, status, error) {
            console.error('Error loading itemQuality.json:', error);
        }
    });

    //dropdownManager.initializeSelect();
    dropdownManager.updateFilterSelect();
});