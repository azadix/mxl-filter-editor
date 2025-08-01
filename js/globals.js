// globals.js
import { RuleManager } from './modules/RuleManager.js';
import { StorageManager } from './modules/StorageManager.js';
import { ToastManager } from './modules/ToastManager.js';
import { DropdownManager } from './modules/DropdownManager.js';
import { FilterEncoder } from './modules/FilterEncoder.js';
import { TableRenderer } from './modules/TableRenderer.js';
import { EventManager } from './modules/EventManager.js';

// Initialize core managers
export const toastManager = new ToastManager();
export const ruleManager = new RuleManager();
export const storageManager = new StorageManager();
export const dropdownManager = new DropdownManager(storageManager);

// These will be initialized later
export let tableManager = null;
export let tableRenderer = null;
export let eventManager = null;
export let filterEncoder = null; // Changed from const to let

export function intializeFilterEncoder() {
    filterEncoder = new FilterEncoder(ruleManager);
}

// Function to complete initialization after data loads
export async function completeInitialization() {
    const { TableManager } = await import('./modules/TableManager.js');
    
    tableManager = new TableManager();
    tableRenderer = tableManager.tableRenderer;
    eventManager = tableManager.eventManager;
}