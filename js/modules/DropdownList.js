import { formatItemNameHtml } from './utils.js';

export class DropdownList {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            placeholder: '',
            searchable: true,
            template: (item) => item.text,
            doNotFilterElement: false,
            isReadOnly: false,
            floating: false,
            ...options
        };
        this.items = [];
        this.selectedItem = null;
        this.shouldRenderOnShow = true;
        this._scrollParents = [];
        this._boundRepositionList = () => this.repositionList();
        this.initialize();
    }

    initialize() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'dropdown-list-container';
        
        // Create input for search
        this.input = document.createElement('input');
        this.input.className = 'input dropdown-list-input';
        this.input.placeholder = this.options.placeholder;
        this.input.readOnly = this.options.isReadOnly;
        this.input.type = 'text';

        // Colored HTML overlay (native inputs can't show multi-span colors)
        this.display = document.createElement('div');
        this.display.className = 'dropdown-list-display';
        this.display.hidden = true;
        this.display.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.input.focus();
            this.input.select();
        });
        
        // Create dropdown list
        this.list = document.createElement('ul');
        this.list.className = 'dropdown-list';
        this.list.style.display = 'none';
        
        // Assemble the structure
        this.container.appendChild(this.input);
        this.container.appendChild(this.display);
        this.container.appendChild(this.list);
        
        // Replace original element
        this.element.replaceWith(this.container);
        
        // Add event listeners
        this.input.addEventListener('focus', () => {
            this.hideColorDisplay();
            if (this.list.style.display === 'block') {
                if (this.input.value && !this.options.doNotFilterElement) {
                    this.filterItems(this.input.value);
                }
            } else {
                this.showList();
            }
        });

        this.input.addEventListener('blur', () => {
            if (!this.isMouseDown) {
                this.hideList();
            }
            // Restore multi-color display when leaving the field (only if text still matches selection)
            if (this.selectedItem && this.input.value === (this.selectedItem.name || this.selectedItem.text || '')) {
                this.updateInputColor(this.selectedItem);
            } else {
                this.hideColorDisplay();
            }
        });

        if (!this.options.doNotFilterElement) {
            this.input.addEventListener('input', (e) => {
                this.hideColorDisplay();
                this.filterItems(e.target.value);
                // Ensure dropdown stays open when filtering
                if (this.list.style.display !== 'block') {
                    this.showList();
                }
            });
        }
        
        // Track mouse state
        this.list.addEventListener('mousedown', () => this.isMouseDown = true);
        this.list.addEventListener('mouseup', () => this.isMouseDown = false);
        
        document.addEventListener('mouseup', () => {
            if (this.isMouseDown) {
                this.isMouseDown = false;
            }
        });

        // Don't render items immediately during initialization
        this.shouldRenderOnShow = true;
    }

    setItems(items) {
        this.items = items;
        // Don't render immediately, wait for showList()
        this.shouldRenderOnShow = true;
    }

    filterItems(searchTerm) {
        if (this.options.doNotFilterElement) {
            return;
        }
        
        const terms = searchTerm.toLowerCase().trim().split(/\s+/);
        
        // If search term is empty, show all items
        if (terms.length === 0 || (terms.length === 1 && terms[0] === '')) {
            this.renderItems(this.items);
            return;
        }
        
        // Otherwise filter items with fuzzy matching
        const filtered = this.items.filter(item => {
            const itemText = (item.name.toLowerCase() + 
                            (item.searchText ? ' ' + item.searchText.toLowerCase() : ''));
            
            // All search terms must be found in the item text
            return terms.every(term => itemText.includes(term));
        });
        
        this.renderItems(filtered);
    }

    renderItems(items = this.items) {
        // Clear existing items
        this.list.innerHTML = '';
        
        if (this.isLoading) {
            const loadingItem = document.createElement('li');
            loadingItem.className = 'dropdown-list-item empty';
            loadingItem.textContent = 'Loading...';
            this.list.appendChild(loadingItem);
            return;
        }
        
        const itemsToRender = this.options.doNotFilterElement ? this.items : items;
        

        if (itemsToRender.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'dropdown-list-item empty';
            emptyItem.textContent = 'No items found';
            this.list.appendChild(emptyItem);
            return;
        }

        // Group items by type
        const groupedItems = itemsToRender.reduce((groups, item) => {
            const type = item.type || 'item';
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push(item);
            return groups;
        }, {});
        
        const orderedGroups = {
            'class': groupedItems['class'] || [],
            'item': groupedItems['item'] || []
        };
        
        Object.entries(orderedGroups).forEach(([type, groupItems]) => {
            if (groupItems.length === 0) return;
        
            const header = document.createElement('li');
            header.className = 'dropdown-list-header';
            
            // Create header text with count
            const headerText = document.createElement('span');
            headerText.className = 'dropdown-header-text';
            headerText.textContent = type === 'class' ? 'Classes' : 'Items';
            
            // Create count badge
            const countBadge = document.createElement('span');
            countBadge.className = 'dropdown-header-count';
            countBadge.textContent = ` (${groupItems.length})`;
            
            // Append both elements to header
            header.appendChild(headerText);
            header.appendChild(countBadge);
            
            this.list.appendChild(header);
            
            groupItems.forEach(item => {
                const li = document.createElement('li');
                li.className = 'dropdown-list-item';
                li.innerHTML = this.options.template(item);
                li.addEventListener('mousedown', () => {
                    this.selectItem(item);
                    this.hideList();
                });
                this.list.appendChild(li);
            });
        });

        if (this.options.floating && this.list.style.display === 'block') {
            this.repositionList();
        }
    }

    selectItem(item) {
        this.selectedItem = item;
        this.input.value = item?.name || item?.text || '';
        this.updateInputColor(item);
        if (this.options.onSelect) {
            this.options.onSelect(item);
        }
        this.element.dispatchEvent(new CustomEvent('change', { detail: item }));
    }

    /** Apply TSW colors on the main field (multi-span via overlay). */
    updateInputColor(item = this.selectedItem) {
        this.clearInputColor();
        this.hideColorDisplay();

        const useColors = localStorage.getItem('useTswColors') === 'true';
        if (!useColors || !item) {
            return;
        }

        const hasSegments = Array.isArray(item.colorSegments) && item.colorSegments.some((s) => s.colorClass);
        if (hasSegments || item.colorClass) {
            this.display.innerHTML = formatItemNameHtml(item.name, item.colorClass, item.colorSegments);
            this.display.hidden = false;
            this.input.classList.add('has-color-display');
        }
    }

    hideColorDisplay() {
        this.display.hidden = true;
        this.display.innerHTML = '';
        this.input.classList.remove('has-color-display');
    }

    clearInputColor() {
        [...this.input.classList].forEach((cls) => {
            if (cls.startsWith('color-')) {
                this.input.classList.remove(cls);
            }
        });
    }

    showList() {
        this.list.style.display = 'block';

        // Only render items if needed
        if (this.shouldRenderOnShow) {
            if (this.input.value && !this.options.doNotFilterElement) {
                this.filterItems(this.input.value);
            } else {
                this.renderItems();
            }
            this.shouldRenderOnShow = false;
        }

        if (this.options.floating) {
            this.attachFloatingList();
        }
    }

    hideList() {
        this.list.style.display = 'none';

        if (this.options.floating) {
            this.detachFloatingList();
        }
    }

    getScrollParents(element) {
        const parents = [];
        let el = element?.parentElement;

        while (el) {
            const style = getComputedStyle(el);
            const overflow = `${style.overflow} ${style.overflowX} ${style.overflowY}`;
            if (/(auto|scroll|overlay)/.test(overflow)) {
                parents.push(el);
            }
            el = el.parentElement;
        }

        return parents;
    }

    attachFloatingList() {
        if (this.list.parentElement !== document.body) {
            document.body.appendChild(this.list);
        }

        this.list.classList.add('dropdown-list-floating');
        this.repositionList();
        this.bindFloatingListeners();
    }

    detachFloatingList() {
        this.unbindFloatingListeners();
        this.list.classList.remove('dropdown-list-floating');

        if (this.list.parentElement !== this.container) {
            this.container.appendChild(this.list);
        }

        this.list.style.position = '';
        this.list.style.left = '';
        this.list.style.top = '';
        this.list.style.width = '';
        this.list.style.minWidth = '';
        this.list.style.maxHeight = '';
        this.list.style.zIndex = '';
    }

    repositionList() {
        if (!this.options.floating || this.list.style.display === 'none') {
            return;
        }

        const rect = this.input.getBoundingClientRect();
        const minWidth = 450;
        const width = Math.max(rect.width, minWidth);

        this.list.style.position = 'fixed';
        this.list.style.left = `${rect.left}px`;
        this.list.style.width = `${width}px`;
        this.list.style.minWidth = `${minWidth}px`;
        this.list.style.zIndex = '1000';

        const maxHeight = Math.min(window.innerHeight * 0.3, window.innerHeight - 16);
        this.list.style.maxHeight = `${maxHeight}px`;

        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const listHeight = this.list.offsetHeight;

        if (spaceBelow < listHeight && spaceAbove > spaceBelow) {
            this.list.style.top = `${Math.max(8, rect.top - listHeight)}px`;
        } else {
            this.list.style.top = `${rect.bottom}px`;
        }
    }

    bindFloatingListeners() {
        if (this._floatingListenersBound) {
            return;
        }

        this._scrollParents = this.getScrollParents(this.container);
        window.addEventListener('resize', this._boundRepositionList);
        window.addEventListener('scroll', this._boundRepositionList, true);
        this._scrollParents.forEach((parent) => {
            parent.addEventListener('scroll', this._boundRepositionList);
        });
        this._floatingListenersBound = true;
    }

    unbindFloatingListeners() {
        if (!this._floatingListenersBound) {
            return;
        }

        window.removeEventListener('resize', this._boundRepositionList);
        window.removeEventListener('scroll', this._boundRepositionList, true);
        this._scrollParents.forEach((parent) => {
            parent.removeEventListener('scroll', this._boundRepositionList);
        });
        this._scrollParents = [];
        this._floatingListenersBound = false;
    }

    get value() {
        return this.selectedItem?.value || null;
    }

    set value(val) {
        const item = this.items.find(i => i.value === val);
        if (item) {
            this.selectItem(item);
        } else {
            // Clear the input if no matching item found
            this.input.value = '';
            this.selectedItem = null;
            this.clearInputColor();
            this.hideColorDisplay();
        }
    }

    destroy() {
        this.detachFloatingList();
        this.container.replaceWith(this.element);
    }

    async loadItemsAsync(loaderFunction) {
        this.isLoading = true;
        this.renderItems(); // Show loading state
        
        try {
            const items = await loaderFunction();
            this.setItems(items);
        } catch (error) {
            console.error('Failed to load items:', error);
            this.setItems([]);
        } finally {
            this.isLoading = false;
        }
    }
}
