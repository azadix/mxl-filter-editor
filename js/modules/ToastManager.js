export class ToastManager {
    showToast(message, autoRemove = false, toastBgClass = 'warning') {
        const container = document.querySelector('.toast-container') || this.createToastContainer();
        const toast = document.createElement("div");
        toast.classList.add("notification", "is-small");
        toast.innerText = message;

        toast.addEventListener('click', () => this.fadeOutAndRemove(toast));

        let timeoutId;
        if (autoRemove) {
            timeoutId = setTimeout(() => this.fadeOutAndRemove(toast), 2500);
        } else {
            toast.classList.add(`is-${toastBgClass}`);
            toast.innerHTML += '<div class="has-text-white">Click to dismiss</div>';
        }

        toast.addEventListener('click', () => {
            if (timeoutId) clearTimeout(timeoutId);
            this.fadeOutAndRemove(toast);
        });

        container.appendChild(toast);
    }

    cleanUpToastMessages() {
        const container = document.querySelector('.toast-container');
        if (!container) return;
    
        const toasts = container.querySelectorAll('.notification');

        toasts.forEach(toast => {
            const timeoutId = toast.dataset.timeoutId;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            this.fadeOutAndRemove(toast);
        });
    
        setTimeout(() => {
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 500);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.classList.add('toast-container');
        document.body.appendChild(container);
        return container;
    }

    fadeOutAndRemove(toast) {
        toast.style.opacity = 0;
        setTimeout(() => toast.remove(), 500);
    }
}