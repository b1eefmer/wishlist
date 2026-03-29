class LooDataStorage {
    constructor(customerId, iid, url, shop, domain) {
        this._customerId = customerId;
        this._appUrl = url;
        this._lists = [];
        this._config = {
            namespace: "loo-lists",
            iid: iid,
            shop: shop,
            domain: domain,
        };

        this.__listsSelector = ".js-popup-button";
        this.__localCustomerVariable = "looListsCustomerId";
        this.__guestCustomerUsername = "guest";

        this.__buttonsContainerSelector = ".loo-prodpage-buttons-container";
        this.__buttonSelector = ".loo-prodpage-button";
        this.__buttonAddedClass = "loo-added";

        this.__listIconSelector = ".loo-list-icon";
        this.__listIconCountSelector = ".loo-count";
        this._init();
    }

    _init() {
        this._loadLists();
        this._loadButtonsState();
        this._loadListsBar();

        if (
            localStorage.getItem(this.__localCustomerVariable) ==
            this._customerId
        ) {
            // same, no action
        } else {
            if (this._customerId == this.__guestCustomerUsername) {
                // clear lists, update customer id
                this._resetLocal();
            } else {
                // load lists
                this._loadListsData();
                // TODO, save guest lists and ask visitor what to do with it.
                // this._pushLocalData();
            }
        }
    }

    _loadLists() {
        const lists = document.querySelectorAll(this.__listsSelector);
        lists.forEach((list) => {
            this._lists.push(list.dataset.jsList);
        });
    }

    _loadListsData() {
        localStorage.setItem(this.__localCustomerVariable, this._customerId);
        this._lists.forEach((list) => {
            this._load(list);
        });
    }

    _pushLocalData() {
        localStorage.setItem(this.__localCustomerVariable, this._customerId);
        this._lists.forEach((list) => {
            let products = localStorage.getItem(list);
            if (products && products != "{}" && products.length > 2) {
                this._save({ key: list }, JSON.parse(products));
            }
        });
    }

    _pushEmptyData() {
        this._lists.forEach((list) => {
            let products = localStorage.getItem(list);
            if (products) {
                this._save({ key: list }, JSON.parse(products));
            }
        });
    }

    _resetLocal() {
        localStorage.setItem(
            this.__localCustomerVariable,
            this.__guestCustomerUsername
        );
        this._lists.forEach((list) => {
            localStorage.setItem(list, JSON.stringify({}));
        });
        this._loadListsBar();
    }
    // la-la I'm writing code... la-la Nothing has been changed

    add(data) {
        const products = JSON.parse(localStorage.getItem(data.key));
        products[data.product.id] = data.product;
        localStorage.setItem(data.key, JSON.stringify(products));
        this.__updateListBarNumbers();

        // send new new object to server
        this._save(data, products);
    }

    remove(data) {
        const products = JSON.parse(localStorage.getItem(data.key));
        delete products[data.product.id];
        localStorage.setItem(data.key, JSON.stringify(products));
        this.__updateListBarNumbers();

        // send new new object to server
        this._save(data, products);
    }

    clearList(list) {
        localStorage.setItem(list, JSON.stringify({}));
        this._pushEmptyData();
        this._loadListsBar();
    }

    _save(data, products) {
        const sendData = { ...this._config };
        sendData.key = data.key;
        sendData.customerid = this._customerId;
        sendData.products = products;

        fetch("https://" + this._appUrl + "/api/a", {
            method: "POST",
            body: JSON.stringify(sendData),
            headers: { "Content-type": "application/json; charset=UTF-8" },
        })
            .then((response) => response.json())
            .then((json) => {
            })
            .catch((err) => {
                console.log(err);
            });
    }

    _load(key) {
        const sendData = { ...this._config };
        sendData.key = key;
        sendData.customerid = this._customerId;

        fetch("https://" + this._appUrl + "/api/l", {
            method: "POST",
            body: JSON.stringify(sendData),
            headers: { "Content-type": "application/json; charset=UTF-8" },
        })
            .then((response) => response.json())
            .then((json) => {
                localStorage.setItem(key, json.products);
                this.__updateListBarNumbers();
            })
            .catch((err) => {
                console.log(err);
            });
    }

    _loadButtonsState() {
        let buttonsContainer = document.querySelector(
            this.__buttonsContainerSelector
        );

        if (buttonsContainer) {
            let buttons = document.querySelectorAll(this.__buttonSelector);
            buttons.forEach((button) => {
                const products = JSON.parse(
                    localStorage.getItem(button.dataset.key)
                );
                if (products[buttonsContainer.dataset.productId]) {
                    button.classList.add(this.__buttonAddedClass);
                }
            });
        }
    }

    __updateListBarNumbers() {
        let listIcons = document.querySelectorAll(this.__listIconSelector);
        listIcons.forEach((listIcon) => {
            const products = JSON.parse(
                localStorage.getItem(listIcon.dataset.jsList)
            );
            if (products) {
                listIcon.querySelector(this.__listIconCountSelector).innerHTML =
                    Object.keys(products).length;
            }
        });
    }

    _loadListsBar() {
        this.__updateListBarNumbers();
    }
}

class LooPopup extends HTMLElement {
    constructor() {
        super();

        this._list = "";
        this._title = this.querySelector(".loo-popup-title");
        this._body = this.querySelector(".loo-popup-body");

        let closeButton = this.querySelector(".js-popup-close");
        let backdrop = this.querySelector(".loo-popup-backdrop");

        closeButton.addEventListener("click", this.onClose.bind(this));
        backdrop.addEventListener("click", this.onClose.bind(this));
    }

    _open() {
        // this._list;
        this.dataset.jsOpen = "true";
        document.body.classList.add("loo-popup-open");
    }

    _close() {
        this.dataset.jsOpen = "fasle";
        document.body.classList.remove("loo-popup-open");
    }

    _setList(list) {
        this._list = list;
    }

    _loadData() {
        if (this._list == "loo-wishlist") {
            this._title.textContent = "Wishlist";

            this._body.innerHTML = "";
            const products = JSON.parse(localStorage.getItem(this._list));
            if (
                Object.keys(products).length === 0 &&
                products.constructor === Object
            ) {
                this._body.innerHTML = "There are no products in  your list";
            } else {

                let productGrid = document.createElement("div");
                productGrid.className = "loo-wishlist-wraper";

                let productValues = Object.values(products);
                productValues.forEach((product) => {
                    let productItem = document.createElement("div");
                    productItem.className = "loo-wishlist-item";

                    let productLink = document.createElement("a");
                    productLink.className = "loo-db";
                    productLink.href = product.url;

                    let productImage = document.createElement("img");
                    productImage.className = "loo-wishlist-item-image";
                    productImage.src = product.image;
                    productImage.srcset =
                        product.image + " 1x, " + product.image2x + " 2x";
                    productImage.alt = product.title;

                    let productTitle = document.createElement("h3");
                    productTitle.className = "loo-wishlist-item-title";
                    productTitle.textContent = product.title;

                    let productPrice = document.createElement("p");
                    productPrice.className = "loo-wishlist-item-price";
                    productPrice.textContent = product.price;

                    productItem.appendChild(productLink);

                    productLink.appendChild(productImage);
                    productLink.appendChild(productTitle);
                    productLink.appendChild(productPrice);

                    productGrid.appendChild(productItem);
                });

                let clearAllLink = document.createElement("a");
                clearAllLink.className = "loo-clear-all";
                clearAllLink.href = '#';
                clearAllLink.textContent = "clear list";
                clearAllLink.addEventListener("click", this.onClearAll.bind(this));

                let clearAllLinkWrapper = document.createElement("div");
                clearAllLinkWrapper.className = "loo-clear-all-wrapper";
                clearAllLinkWrapper.appendChild(clearAllLink);

                this._body.appendChild(productGrid);
                this._body.appendChild(clearAllLinkWrapper);
            }
        }
        if (this._list == "loo-compare") {
            this._title.textContent = "Compare products";
            this._body.innerHTML = "";
        }
    }

    _clearAll() {
        window.looListDataStorage.clearList(this._list);
        this._loadData();
    }

    open(list) {
        this._setList(list);
        this._loadData();
        this._open();
    }

    onClose(event) {
        event.preventDefault();
        this._close();
    }

    onClearAll(event) {
        event.preventDefault();
        this._clearAll();
    }
}

class LooListBar extends HTMLElement {
    constructor() {
        super();

        let PopupButtons = this.querySelectorAll(".js-popup-button");

        PopupButtons.forEach((elem) => {
            elem.addEventListener("click", this.onClick.bind(this));
        });

        window.looListDataStorage = new LooDataStorage(
            this.dataset.customerId,
            this.dataset.iid,
            this.dataset.url,
            this.dataset.shop,
            this.dataset.domain
        );

    }

    onClick(event) {
        event.preventDefault();
        const Popup = document.querySelector("loo-popup");
        Popup.open(
            event.currentTarget.dataset.jsList
        );
    }
}
customElements.define("loo-popup", LooPopup);
customElements.define("loo-lists-bar", LooListBar);
