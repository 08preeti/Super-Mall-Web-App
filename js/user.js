function logUserAction(action, details) {

  const user = auth.currentUser;
  if (!user) return;

  db.collection("logs").add({
    action: action,
    userEmail: user.email,
    details: details,
    role: "user",
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}

auth.onAuthStateChanged(async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const docRef = db.collection("users").doc(user.uid);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    window.location.href = "login.html";
    return;
  }

  const userData = docSnap.data();

  if (userData.role !== "user") {
    window.location.href = "admin.html";
    return;
  }

  console.log("User verified ✅");

  loadShops();
  loadProducts();
  loadOffers();
});

function logout() {

  logUserAction("Logout", "User logged out");

  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}

async function loadShops() {

  const shopList = document.getElementById("shopList");
  shopList.innerHTML = "";

  const snapshot = await db.collection("shops").get();

  snapshot.forEach(doc => {
    const shop = doc.data();

    const li = document.createElement("li");
    li.innerText =
  shop.name +
  " | Floor: " + shop.floor +
  " | " + shop.location;

    shopList.appendChild(li);
  });
}

let allProducts = [];
let compareList = [];

async function loadProducts() {

  const container = document.getElementById("productContainer");
  const categoryFilter = document.getElementById("categoryFilter");
  const shopFilter = document.getElementById("shopFilter");

  container.innerHTML = "";
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  shopFilter.innerHTML = '<option value="all">All Shops</option>';

  const floorFilter = document.getElementById("floorFilter");
floorFilter.innerHTML = '<option value="all">All Floors</option>';

const shopSnapshot = await db.collection("shops").get();
const shopMap = {};
const floors = new Set();

shopSnapshot.forEach(doc => {

  const shopData = doc.data();

  shopMap[doc.id] = {
    name: shopData.name,
    floor: shopData.floor
  };

  floors.add(shopData.floor);

  const option = document.createElement("option");
  option.value = doc.id;
  option.textContent = shopData.name;
  shopFilter.appendChild(option);
});

floors.forEach(floor => {
  const option = document.createElement("option");
  option.value = floor;
  option.textContent = "Floor " + floor;
  floorFilter.appendChild(option);
});

  const productSnapshot = await db.collection("products").get();
  const categories = new Set();
  allProducts = [];

  productSnapshot.forEach(doc => {

    const product = {
      id: doc.id,
      ...doc.data(),
      shopName: shopMap[doc.data().shopId]?.name || "Unknown",
      floor: shopMap[doc.data().shopId]?.floor || "N/A"
    };

    allProducts.push(product);
    categories.add(product.category);
  });

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  displayProducts(allProducts);
}


function displayProducts(products) {

  const container = document.getElementById("productContainer");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>No products found</p>";
    return;
  }

  products.forEach(product => {

    const card = document.createElement("div");
    card.classList.add("product-card");

    card.innerHTML = `
      <h3>${product.name}</h3>
      <div class="category-badge">${product.category}</div>
      <p><strong>Shop:</strong> ${product.shopName}</p>
      <div class="product-price">₹${product.price}</div>
      <button onclick="addToCart('${product.name}', ${product.price})">
        Add to Cart
      </button>
      <button onclick="addToCompare('${product.id}')">
        Compare
      </button>
    `;

    container.appendChild(card);
  });
}

function filterProducts() {

  const selectedCategory =
    document.getElementById("categoryFilter").value;

  const selectedShop =
    document.getElementById("shopFilter").value;

  const selectedFloor =
    document.getElementById("floorFilter").value;

  let filtered = allProducts;

if (selectedFloor !== "all") {
  filtered = filtered.filter(product =>
    product.floor === selectedFloor
  );
}

if (selectedShop !== "all") {
  filtered = filtered.filter(product =>
    product.shopId === selectedShop
  );
}

if (selectedCategory !== "all") {
  filtered = filtered.filter(product =>
    product.category.trim().toLowerCase() ===
    selectedCategory.trim().toLowerCase()
  );
}

  displayProducts(filtered);
}

async function loadOffers() {

  const offerList = document.getElementById("offerList");
  offerList.innerHTML = "";

  const snapshot = await db.collection("offers").get();

  snapshot.forEach(doc => {
    const offer = doc.data();

    const li = document.createElement("li");
    li.innerText =
      offer.title +
      " - " + offer.discount + "% (till " +
      offer.validTill + ")";

    offerList.appendChild(li);
  });
}

let cart = [];
let total = 0;

function addToCart(name, price) {

  const existingItem = cart.find(item => item.name === name);

  if (existingItem) {
    existingItem.quantity += 1;
    logUserAction("Increase Quantity", name);
  } else {
    cart.push({ name, price, quantity: 1 });
    logUserAction("Add To Cart", name);
  }

  calculateTotal();
  updateCart();
}


function updateCart() {

  const cartList = document.getElementById("cartList");
  const cartTotal = document.getElementById("cartTotal");

  cartList.innerHTML = "";

  cart.forEach((item, index) => {

    const li = document.createElement("li");

    li.innerHTML = `
      ${item.name} - ₹${item.price} x ${item.quantity}
      <button onclick="increaseQty(${index})">+</button>
      <button onclick="decreaseQty(${index})">-</button>
      <button onclick="removeFromCart(${index})">❌</button>
    `;

    cartList.appendChild(li);
  });

  cartTotal.textContent = total;
}


function increaseQty(index) {
  cart[index].quantity += 1;
  logUserAction("Increase Quantity", cart[index].name);
  calculateTotal();
  updateCart();
}


function decreaseQty(index) {

  const productName = cart[index].name;

  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
    logUserAction("Decrease Quantity", productName);
  } else {
    cart.splice(index, 1);
    logUserAction("Remove From Cart", productName);
  }

  calculateTotal();
  updateCart();
}


function removeFromCart(index) {

  const productName = cart[index].name;

  cart.splice(index, 1);

  logUserAction("Remove From Cart", productName);

  calculateTotal();
  updateCart();
}


function calculateTotal() {
  total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;
  });
}


function checkout() {

  if (cart.length === 0) {
    alert("Cart is empty!");
    return;
  }

  logUserAction("Checkout", `Total Amount: ₹${total}`);

  alert("Order placed successfully! 🎉");

  cart = [];
  total = 0;
  updateCart();
}

function addToCompare(productId) {

  if (compareList.length >= 2) {
    alert("You can compare only 2 products at a time.");
    return;
  }

  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  if (compareList.some(p => p.id === productId)) {
    alert("Product already selected.");
    return;
  }

  compareList.push(product);

  logUserAction("Add To Compare", product.name);

  updateCompareSection();
}


function updateCompareSection() {

  const section = document.getElementById("compareSection");

  if (compareList.length < 2) {
    section.innerHTML = "<p>Select 2 products to compare.</p>";
    return;
  }

  const p1 = compareList[0];
  const p2 = compareList[1];

  section.innerHTML = `
    <table border="1" cellpadding="10">
      <tr>
        <th>Feature</th>
        <th>${p1.name}</th>
        <th>${p2.name}</th>
      </tr>
      <tr>
        <td>Category</td>
        <td>${p1.category}</td>
        <td>${p2.category}</td>
      </tr>
      <tr>
        <td>Shop</td>
        <td>${p1.shopName}</td>
        <td>${p2.shopName}</td>
      </tr>
      <tr>
        <td>Price</td>
        <td>₹${p1.price}</td>
        <td>₹${p2.price}</td>
      </tr>
    </table>
    <br>
    <button onclick="clearCompare()">Clear Comparison</button>
  `;
}


function clearCompare() {
  compareList = [];
  updateCompareSection();
}


document.addEventListener("DOMContentLoaded", () => {

  const categoryFilter = document.getElementById("categoryFilter");
  const shopFilter = document.getElementById("shopFilter");
  const floorFilter = document.getElementById("floorFilter");

  if (categoryFilter)
    categoryFilter.addEventListener("change", filterProducts);

  if (shopFilter)
    shopFilter.addEventListener("change", filterProducts);

  if (floorFilter)
    floorFilter.addEventListener("change", filterProducts);
});