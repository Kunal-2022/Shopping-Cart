const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

// cart containing the products
// we cannot able to load the buttons before the DOM content is not loaded
let cart = [];

// Buttons 
let buttonsDOM = [];

// getting the products
class Products {
    async getProducts() {
        try {
            let result = await fetch("products.json");
            let data = await result.json();

            let products = data.items;
            products = products.map(item => {
                const { title, price } = item.fields;
                const { id } = item.sys;
                const image = item.fields.image.fields.file.url;
                return { title, price, id, image };
            });
            return products;
        } catch (error) {
            console.log(error);
        }
    }
}

// display Products
class UI {
    displayProducts(products) {
        let result = "";
        for (let i = 0; i < products.length; i++) {
            result += `
            <article class="product">
                <div class="img-container">
                    <img src= ${products[i].image} alt="not-fount" class="product-img">
                    <button class="bag-btn" data-id=${products[i].id}>
                        <i class="fas fa-shopping-cart"></i>
                        add to bag
                    </button>
                </div>
                <h3>${products[i].title}</h3>
                <h4>$${products[i].price}</h4>
            </article>`
        }
        productsDOM.innerHTML = result;
    }

    getBagButtons() {
        const btns = [...document.querySelectorAll(".bag-btn")];
        //console.log(btns);
        buttonsDOM = btns;
        btns.forEach(button => {
            let id = button.dataset.id;
            //console.log(id);
            let inCart = cart.find(item => item.id === id);
            if (inCart) {
                button.innerText = "IN CART";
                button.disabled = true;
            }
            else {
                button.addEventListener('click', event => {
                    event.target.innerText = "IN CART";
                    event.target.disabled = true;

                    // (1) get products from the cart.
                    let cartItem = { ...storage.getProduct(id), amount: 1 };
                    //console.log(cartItem);

                    //(2)add product to the cart.
                    cart = [...cart, cartItem];

                    //(3).Save cart in local storage.
                    storage.saveCart(cart);

                    //(4).Set cart values.
                    this.setCartValues(cart);

                    //(5).Display cart Item.
                    this.addCartItem(cartItem);
                    console.log(cartContent);

                    //(6) And show the cart.
                    this.showCart();

                });
            }
        });
    }
    setCartValues(cart) {
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map((item) => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        })
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    }

    addCartItem(item) {
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `<img src="${item.image}" alt="not-Found">
        <div>
            <h4>${item.title}</h4>
            <h5>$${item.price}</h5>
            <span class="remove-item" data-id = ${item.id}> remove </span>
        </div>
        <div>
            <i class="fas fa-chevron-up" data-id = ${item.id}></i>
            <p class="item-amount"> ${item.amount} </p>
            <i class="fas fa-chevron-down" data-id = ${item.id}></i>
        </div>`;
        cartContent.appendChild(div);
    }

    showCart() {
        cartOverlay.classList.add('transparentBcg');
        cartDOM.classList.add("showCart");
    }

    // This method ensures that we dont loose our cart whenever we refresh our web app.
    // In this methid first we get the values from the local storage because local storage does not changes     whenever we refresh our web app;
    // Then we set all the values from local storage to our current cart and using two methods (setCartValues and populateCart);
    //Then we add finctionality to our cartBtn and closeCartBtn.

    setupAPP() {
        cart = storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener("click", this.showCart);
        closeCartBtn.addEventListener("click", this.hideCart);
    }
    populateCart(cart) {
        cart.forEach(item => this.addCartItem(item));
    }
    hideCart() {
        cartOverlay.classList.remove('transparentBcg');
        cartDOM.classList.remove('showCart');
    }
    // this mthod add functionality to clear cart button.

    cartLogic() {
        //console.log("1");
        //1. Clear cart buttton.
        clearCartBtn.addEventListener("click", () => {
            this.clearCart();
        });

        //2. Cart functionality.(remove button , increasing the number of itms and decrease the count of a particular attom using (down) button.)

        cartContent.addEventListener("click", event => {
            // 1. for removing the item.

            if (event.target.classList.contains("remove-item")) {
                //console.log(event);
                let removeItem = event.target;
                //console.log(removeItem);
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItem(id);
            }

            //2. for increasing the amount of the product.

            else if (event.target.classList.contains("fa-chevron-up")) {
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                // update in the cart
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                // update the values of amount in the local storage
                storage.saveCart(cart);
                // upadate the values of (total-cart-items) and (total-cart-value)
                this.setCartValues(cart);
                let sibling = addAmount.nextElementSibling;
                sibling.innerText = tempItem.amount;
            }

            // 3.for decreasing the amount of the product;

            else if (event.target.classList.contains("fa-chevron-down")) {
                let subAmount = event.target;
                let id = subAmount.dataset.id;
                // update the cart
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount - 1;
                if (tempItem.amount == 0) {
                    this.removeItem(id);
                    cartContent.removeChild(subAmount.parentElement.parentElement);
                }
                else {
                    let sibling = subAmount.previousElementSibling;
                    sibling.innerText = tempItem.amount;
                    storage.saveCart(cart);
                    this.setCartValues(cart);
                }
            }

        });

    }
    clearCart() {
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));
        console.log(cartItems);
        console.log(cartContent.children);
        while (cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0]);
        }
        this.hideCart();
    }
    removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.disable = false;
        button.innerHTML = `<i class="fas fa-shoping-cart"></i> Add to bag.`
    }
    getSingleButton(id) {
        return buttonsDOM.find(button => button.dataset.id === id);
    }
}

// local storage
class storage {
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }
    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id === id);
    }
    static saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
    }
    static getCart() {
        return localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")) : [];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products();
    // set up app
    ui.setupAPP();
    // get all the products
    products.getProducts().then((products) => {
        ui.displayProducts(products);
        storage.saveProducts(products);
    }).then(() => {
        ui.getBagButtons();
        ui.cartLogic();
    });
})