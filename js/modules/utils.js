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

export function applySharedFilter(sharedFilter, ruleManager, toastManager) {
    try {
        $('#defaultShowItems').prop('checked', sharedFilter.default_show_items);
        $('#filterName').val(sharedFilter.name);
        ruleManager.clearRules();
        sharedFilter.rules.reverse().forEach(rule => ruleManager.addRule(rule));
        toastManager.showToast('Shared filter loaded!', true);
        return true;
    } catch (e) {
        toastManager.showToast('Invalid shared filter', false, 'danger');
        return false;
    }
}

export function createShareButton(toastManager, ruleManager, filterEncoder) {
    const shareButton = document.createElement('button');
    shareButton.id = 'shareFilter';
    shareButton.className = 'button is-info is-inverted is-outlined';
    shareButton.innerHTML = '<i class="fas fa-share-alt pr-1"></i> Share';
    shareButton.setAttribute('aria-label', 'Share filter via link');
    
    shareButton.addEventListener('click', () => {
        try {
            const filterData = ruleManager.generateOutput();
            const shareLink = filterEncoder.generateShortenedLink(JSON.parse(filterData));
            
            if (shareLink) {
                navigator.clipboard.writeText(shareLink)
                    .then(() => {
                        toastManager.showToast('Share link copied', true);
                    })
                    .catch(() => {
                        // Fallback if clipboard API fails
                        prompt('Copy this compact link to share your filter:', shareLink);
                    });
            } else {
                toastManager.showToast('Failed to generate share link', false, 'danger');
            }
        } catch (error) {
            console.error('Error sharing filter:', error);
            toastManager.showToast('Error sharing filter', false, 'danger');
        }
    });
    
    return shareButton;
}

export function initHashChangeListener(ruleManager, toastManager, filterEncoder, tableManager) {
    window.addEventListener('hashchange', () => {
        const newHash = window.location.hash.substring(1);
        if (newHash) {
            const sharedFilter = filterEncoder.loadFromShortenedLink(newHash);
            if (sharedFilter) {
                const success = applySharedFilter(sharedFilter, ruleManager, toastManager);
                if (success && tableManager?.tableRenderer) {
                    tableManager.tableRenderer.render();
                }
            }
        }
    });
}