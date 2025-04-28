export class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'savedFilters';
    }

    initializeStorage() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        }
    }

    getFilters() {
        this.initializeStorage();
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY));
    }

    saveFilter(name, data) {
        this.initializeStorage();
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

    loadFilter(name) {
        const filters = this.getFilters();
        const filter = filters.find(f => f.name === name);
        return filter ? filter.data : null;
    }

    deleteFilter(name) {
        const filters = this.getFilters();
        const newFilters = filters.filter(f => f.name !== name);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newFilters));
        return filters.length !== newFilters.length;
    }

    getFilterNames() {
        return this.getFilters().map(f => f.name);
    }

    getFilterMetadata() {
        return this.getFilters().map(({ name, lastSavedAt }) => ({
            name,
            lastSavedAt
        }));
    }
}