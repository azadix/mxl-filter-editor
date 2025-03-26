export class ToastManager {
    showToast(message, autoRemove = false, toastBgClass = 'warning') {
        const container = document.querySelector('.toast-container') || this.createToastContainer();
        const toast = document.createElement("div");
        toast.classList.add("notification", "is-small");
        toast.innerText = message;

        toast.addEventListener('click', () => this.fadeOutAndRemove(toast));

        if (autoRemove) {
            setTimeout(() => this.fadeOutAndRemove(toast), 2500);
        } else {
            toast.classList.add(`is-${toastBgClass}`);
            toast.innerHTML += '<div class="has-text-white">Click to dismiss</div>';
        }

        container.appendChild(toast);
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