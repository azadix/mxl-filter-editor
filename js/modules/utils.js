export function clampLvlValues(value) {
    const numericValue = Number(value);
    return !isNaN(numericValue) && value !== "" ? Math.min(Math.max(numericValue, 0), 150) : 0;
}

export function sanitizeFilterName(name) {
    return name.replace(/[^a-zA-Z0-9\s\-_]/g, "");
}

export function loadJsonData(filePath, isSorted, loaderMethod, manager, toastManager) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: filePath,
            dataType: 'json',
            success: function(data) {
                try {
                    if (isSorted && Array.isArray(data)) {
                        data.sort((a, b) => a.name.localeCompare(b.name));
                    }
                    manager[loaderMethod](data);
                    resolve();
                } catch (error) {
                    reject(new Error(`Error processing ${filePath}: ${error.message}`));
                }
            },
            error: function(xhr, status, error) {
                const fileName = filePath.split('/').pop();
                const errorMsg = `Error loading ${fileName}: ${error}`;
                
                if (toastManager) {
                    toastManager.showToast(errorMsg, false, 'danger');
                }
                reject(new Error(errorMsg));
            }
        });
    });
}

export function initShareFilterButton(toastManager, ruleManager) {
    const shareButton = document.createElement('button');
    shareButton.id = 'shareFilter';
    shareButton.className = 'button is-info is-inverted is-outlined';
    shareButton.innerHTML = '<i class="fas fa-share-alt pr-1"></i> Share';
    shareButton.setAttribute('aria-label', 'Share filter via link');
    
    shareButton.addEventListener('click', () => {
        const filterData = ruleManager.generateOutput();
        const shareLink = generateShortenedLink(filterData);
        
        if (shareLink) {
            navigator.clipboard.writeText(shareLink)
                .then(() => toastManager.showToast('Share link copied!', true))
                .catch(() => {
                    // Fallback if clipboard API fails
                    prompt('Copy this compact link to share your filter:', shareLink);
                });
        } else {
            toastManager.showToast('Failed to generate share link', false, 'danger');
        }
    });
    
    // Add button to UI
    const buttonGroup = document.querySelector('.field.is-grouped.ml-2');
    if (buttonGroup) {
        buttonGroup.insertBefore(shareButton, buttonGroup.children[3]);
    }
}

export function generateShortenedLink(filterData) {
    try {
        // 1. Stringify the filter data
        const jsonString = JSON.stringify(filterData);
        
        // 2. Compress using LZString
        const compressed = LZString.compressToEncodedURIComponent(jsonString);
        
        // 3. Create the URL
        return `${window.location.origin}${window.location.pathname}#${compressed}`;
    } catch (error) {
        console.error('Error generating shortened link:', error);
        return null;
    }
}

export function loadFromShortenedLink() {
    try {
        const hash = window.location.hash.substring(1);
        if (!hash) return null;
        
        // 1. Decompress using LZString
        const jsonString = LZString.decompressFromEncodedURIComponent(hash);
        if (!jsonString) return null;
        
        // 2. Parse back to JSON
        const filterData = JSON.parse(jsonString);
        
        // 3. Clear hash
        window.location.hash = '';
        
        return filterData;
    } catch (error) {
        console.error('Error loading from shortened link:', error);
        return null;
    }
}