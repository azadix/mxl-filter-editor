import { 
    ruleManager, 
    toastManager, 
    filterEncoder, 
    tableManager,
    storageManager,
    tableRenderer
} from '../globals.js';

export function clampLvlValues(value) {
    const numericValue = Number(value);
    return !isNaN(numericValue) && value !== "" ? Math.min(Math.max(numericValue, 0), 150) : 0;
}

export function sanitizeFilterName(name) {
    return name.replace(/[^a-zA-Z0-9\s\-_]/g, "");
}

export function loadJsonData(filePath, shouldSort, shouldClean, loaderMethod, manager, toastManager) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: filePath,
            dataType: 'json',
            success: function(data) {
                try {
                    if (shouldClean) {
                        const parsed = parseItemNames(data);
                        data = parsed.names;
                        if (typeof manager.loadItemColorClasses === 'function') {
                            manager.loadItemColorClasses(parsed.colorClasses);
                        }
                        if (typeof manager.loadItemColorSegments === 'function') {
                            manager.loadItemColorSegments(parsed.colorSegments);
                        }
                    }
                    
                    if (shouldSort && typeof data === 'object' && data !== null) {
                        // Get sorted entries
                        const entries = Object.entries(data)
                            .sort(([keyA, valueA], [keyB, valueB]) => {
                                return valueA.localeCompare(valueB, undefined, { 
                                    sensitivity: 'base',
                                    numeric: true 
                                });
                            });
                        
                        data = entries;
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

/** Parse TSW `<span class='color-*'>…</span>` into plain name + color segments. */
export function parseItemName(raw) {
    if (typeof raw !== 'string') {
        return { name: '', colorClass: null, colorSegments: [] };
    }

    const spanRegex = /<span[^>]*class\s*=\s*['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/span>/gi;
    const spans = [];
    let match;
    while ((match = spanRegex.exec(raw)) !== null) {
        const colorClass = match[1].trim();
        const text = match[2].replace(/<[^>]+>/g, '');
        spans.push({
            colorClass: /^color-[a-z0-9]+$/i.test(colorClass) ? colorClass : null,
            text
        });
    }

    if (spans.length > 0) {
        const name = spans.map((s) => s.text).join('').replace(/\s+/g, ' ').trim();
        const primary = spans.reduce((best, span) =>
            span.text.trim().length > best.text.trim().length ? span : best
        );
        return {
            name,
            colorClass: primary.colorClass || null,
            colorSegments: spans
        };
    }

    const name = raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return {
        name,
        colorClass: null,
        colorSegments: name ? [{ colorClass: null, text: name }] : []
    };
}

function parseItemNames(data) {
    if (typeof data !== 'object' || data === null) {
        return { names: data, colorClasses: {}, colorSegments: {} };
    }

    const names = {};
    const colorClasses = {};
    const colorSegments = {};

    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            const parsed = parseItemName(value);
            names[key] = parsed.name;
            if (parsed.colorClass) {
                colorClasses[key] = parsed.colorClass;
            }
            if (parsed.colorSegments?.length) {
                colorSegments[key] = parsed.colorSegments;
            }
        } else {
            names[key] = value;
        }
    }

    return { names, colorClasses, colorSegments };
}

export function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Render item name with optional TSW color spans (when setting enabled). */
export function formatItemNameHtml(name, colorClass, colorSegments) {
    const useColors = localStorage.getItem('useTswColors') === 'true';

    if (useColors && Array.isArray(colorSegments) && colorSegments.length > 0) {
        return colorSegments.map((seg) => {
            const safe = escapeHtml(seg.text ?? '');
            const cls = seg.colorClass && /^color-[a-z0-9]+$/i.test(seg.colorClass)
                ? seg.colorClass
                : null;
            return cls ? `<span class="${cls}">${safe}</span>` : `<span>${safe}</span>`;
        }).join('');
    }

    const safeName = escapeHtml(name || 'Unknown');
    const safeClass = colorClass && /^color-[a-z0-9]+$/i.test(colorClass) ? colorClass : null;

    if (useColors && safeClass) {
        return `<span class="${safeClass}">${safeName}</span>`;
    }
    return `<span>${safeName}</span>`;
}

export function applySharedFilter(filter, ruleManager, toastManager) {
    try {
        $('#defaultShowItems').prop('checked', filter.default_show_items);
        $('#filterName').val(filter.name);
        ruleManager.clearRules();
        filter.rules.reverse().forEach(rule => ruleManager.addRule(rule));
        toastManager.showToast(`Filter '${filter.name}' loaded!`, true);
        return true;
    } catch (e) {
        toastManager.showToast('Error while loading filter from URL:' + e.message, false, 'danger');
        return false;
    }
}

export async function fetchFilterFromAPI(apiUrl) {
    try {        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API fetch error:', error);
        throw error;
    }
}

/** Synced TSW filters from `public/tsw_filters/filters/{id}.json` (see scripts/sync_tsw_filters.py). */
const TSW_PUBLIC_FILTERS_BASE = './public/tsw_filters/filters';

export const TSW_MANIFEST_URL = './public/tsw_filters/manifest.json';

export async function fetchTswFilterManifest() {
    const response = await fetch(TSW_MANIFEST_URL);
    if (!response.ok) {
        throw new Error(`Manifest not found (${response.status})`);
    }
    return await response.json();
}

export async function fetchTswFilterFromPublic(id) {
    const idStr = String(id).trim();
    if (!/^\d+$/.test(idStr)) {
        throw new Error('Invalid filter id');
    }
    const response = await fetch(`${TSW_PUBLIC_FILTERS_BASE}/${idStr}.json`);
    if (!response.ok) {
        throw new Error(`Filter not found (${response.status})`);
    }
    return await response.json();
}

export function getUrlParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

export function loadFilterFromStorage(filterName, ruleManager, tableRenderer, toastManager) {
    if (!filterName) {
        toastManager.showToast("Please select a filter to load.", true);
        return false;
    }
    
    const filterData = storageManager.loadFilter(filterName);
    if (filterData) {
        const parsedData = JSON.parse(filterData);
        $('#defaultShowItems').prop('checked', parsedData.default_show_items);
        $('#filterName').val(filterName);

        ruleManager.clearRules();
        parsedData.rules.reverse().forEach(rule => ruleManager.addRule(rule));
        tableRenderer.render();
        
        toastManager.showToast(`Filter "${filterName}" loaded successfully!`, true);
        return true;
    } else {
        toastManager.showToast(`Filter "${filterName}" not found.`, true);
        return false;
    }
}