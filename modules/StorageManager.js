export class StorageManager {
    saveFilter(name, data) {
        localStorage.setItem(name, data);
    }

    loadFilter(name) {
        const data = localStorage.getItem(name);
        return data ? JSON.parse(data) : null;
    }

    deleteFilter(name) {
        const wasTheFilterInStorage = localStorage.getItem(name);
        localStorage.removeItem(name);
        return wasTheFilterInStorage;
    }

    getFilterNames() {
        return Object.keys(localStorage).filter(key => key !== 'defaultNotify' && key !== 'defaultMap');
    }
}