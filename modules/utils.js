export function clampLvlValues(value) {
    const numericValue = Number(value);
    return !isNaN(numericValue) && value !== "" ? Math.min(Math.max(numericValue, 0), 150) : 0;
}

export function sanitizeFilterName(name) {
    return name.replace(/[^a-zA-Z0-9\s\-_]/g, "");
}

export function loadJsonData(filePath, isSorted, loaderMethod, manager) {
    $.ajax({
        url: filePath,
        dataType: 'json',
        success: function(data) {
            if (isSorted && Array.isArray(data)) {
                data.sort((a, b) => a.name.localeCompare(b.name));
            }
            manager[loaderMethod](data);
        },
        error: function(xhr, status, error) {
            const fileName = filePath.split('/').pop();
            toastManager.showToast(`Error loading ${fileName}`, false, 'is-danger');
            console.error(`Error loading ${fileName}`, error);
        }
    });
}
