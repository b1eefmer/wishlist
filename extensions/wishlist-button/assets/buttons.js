class LooProdpageButton extends HTMLElement {
    constructor() {
        super();

        this.__buttonAddedClass = "loo-added";

        this._buttonsContainer = this.closest(
            ".loo-prodpage-buttons-container"
        );

        this._productId = this._buttonsContainer.dataset.productId;
        this._list = this.dataset.key
        this.addEventListener("click", this.onClick.bind(this));
    }

    _prepareData() {
        const data = {
            key: this._list,
            product: {
                id: this._productId,
                handle: this._buttonsContainer.dataset.productHandle,
                image: this._buttonsContainer.dataset.productImage,
                image2x: this._buttonsContainer.dataset.productImage2x,
                url: this._buttonsContainer.dataset.productUrl,
                title: this._buttonsContainer.dataset.productTitle,
                price: this._buttonsContainer.dataset.productPrice,
            },
        };

        return data;
    }

    add() {
        window.looListDataStorage.add(this._prepareData());

        this.classList.add(this.__buttonAddedClass);
    }

    remove() {
        window.looListDataStorage.remove(this._prepareData());

        this.classList.remove(this.__buttonAddedClass);
    }

    onClick(event) {
        event.preventDefault();
        if (this.classList.contains(this.__buttonAddedClass)) {
            this.remove();
        } else {
            this.add();
        }
    }
}

customElements.define("loo-prodpage-button", LooProdpageButton);
