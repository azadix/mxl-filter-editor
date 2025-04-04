export class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'savedFilters';
        this.migrateOldFilters();
    }

    // Initialize storage with empty array if it doesn't exist
    _initializeStorage() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
    }

    // Get all filters
    getFilters() {
        this._initializeStorage();
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY));
    }

    // Save a new filter
    saveFilter(name, data) {
        this._initializeStorage();
        const filters = this.getFilters();
        const existingIndex = filters.findIndex(f => f.name === name);
        
        const filterData = {
            name: name,
            data: data,
            lastSavedAt: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            filters[existingIndex] = filterData;
        } else {
            filters.push(filterData);
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filters));
    }

    // Load a filter by name
    loadFilter(name) {
        const filters = this.getFilters();
        const filter = filters.find(f => f.name === name);
        return filter ? filter.data : null;
    }

    // Delete a filter by name
    deleteFilter(name) {
        const filters = this.getFilters();
        const newFilters = filters.filter(f => f.name !== name);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newFilters));
        return filters.length !== newFilters.length;
    }

    // Get all filter names
    getFilterNames() {
        return this.getFilters().map(f => f.name);
    }

    // Get filter metadata (name, lastSavedAt)
    getFilterMetadata() {
        return this.getFilters().map(({ name, lastSavedAt }) => ({
            name,
            lastSavedAt
        }));
    }

    migrateOldFilters() {
        const oldFilters = Object.keys(localStorage)
            .filter(key => key !== 'defaultNotify' && key !== 'defaultMap' && key !== this.STORAGE_KEY);
            
        if (oldFilters.length > 0) {
            oldFilters.forEach(name => {
                const data = localStorage.getItem(name);
                this.saveFilter(name, data);
                localStorage.removeItem(name);
            });
            return true;
        }
        return false;
    }
}