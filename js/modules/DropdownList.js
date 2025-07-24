export class DropdownList {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            placeholder: '',
            searchable: true,
            template: (item) => item.text,
            doNotFilterElement: false,
            ...options
        };
        this.items = [];
        this.selectedItem = null;
        this.shouldRenderOnShow = true;
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
        this.input.type = 'text';
        
        // Create dropdown list
        this.list = document.createElement('ul');
        this.list.className = 'dropdown-list';
        this.list.style.display = 'none';
        
        // Assemble the structure
        this.container.appendChild(this.input);
        this.container.appendChild(this.list);
        
        // Replace original element
        this.element.replaceWith(this.container);
        
        // Add event listeners
        this.input.addEventListener('focus', () => {
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
        });

        if (!this.options.doNotFilterElement) {
            this.input.addEventListener('input', (e) => {
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
        
        const term = searchTerm.toLowerCase();
        
        // If search term is empty, show all items
        if (term === '') {
            this.renderItems(this.items); // Show full list
            return;
        }
        
        // Otherwise filter items
        const filtered = this.items.filter(item => 
            item.text.toLowerCase().includes(term) || 
            (item.searchText && item.searchText.toLowerCase().includes(term))
        );
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
    }

    selectItem(item) {
        this.selectedItem = item;
        this.input.value = item?.name || item?.text || '';
        if (this.options.onSelect) {
            this.options.onSelect(item);
        }
        this.element.dispatchEvent(new CustomEvent('change', { detail: item }));
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
    }

    hideList() {
        this.list.style.display = 'none';
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
        }
    }

    destroy() {
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