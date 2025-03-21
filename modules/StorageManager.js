export class StorageManager {
    saveFilter(name, data) {
        localStorage.setItem(name, JSON.stringify(data));
    }

    loadFilter(name) {
        const data = localStorage.getItem(name);
        return data ? JSON.parse(data) : null;
    }

    deleteFilter(name) {
        localStorage.removeItem(name);
    }

    getFilterNames() {
        return Object.keys(localStorage).filter(key => key !== 'defaultNotify' && key !== 'defaultMap');
    }
}