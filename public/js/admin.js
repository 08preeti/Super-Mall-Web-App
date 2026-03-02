auth.onAuthStateChanged(async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    const docRef = db.collection("users").doc(user.uid);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      alert("User data not found!");
      window.location.href = "login.html";
      return;
    }

    const userData = docSnap.data();

    if (userData.role !== "admin") {
      alert("Access Denied! Not an Admin.");
      window.location.href = "index.html";
      return;
    }

    console.log("Admin verified ✅");

    loadDashboardStats();
    loadShops();
    loadProducts();
    loadOffers();
    loadShopDropdowns();

  } catch (error) {
    console.error("Error checking admin role:", error);
  }

});

function logAction(action, details) {
  const user = auth.currentUser;

  if (!user) return;

  db.collection("logs").add({
    action: action,
    userEmail: user.email,
    details: details,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function logout() {
  logAction("Logout", "Admin logged out");

  auth.signOut()
    .then(() => {
      window.location.href = "login.html";
    });
}

function addShop() {
  const name = document.getElementById("shopName").value;
  const location = document.getElementById("shopLocation").value;
  const floor = document.getElementById("shopFloor").value;
  if (!name || !location) {
    alert("Fill shop details");
    return;
  }

  db.collection("shops").add({
    name,
    location,
    floor,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {

    logAction("Create Shop", `Shop: ${name}`);

    document.getElementById("shopName").value = "";
    document.getElementById("shopLocation").value = "";

    loadShops();
    loadShopDropdowns();
  });
}

function loadShops() {
  const list = document.getElementById("shopList");
  list.innerHTML = "";

  db.collection("shops").get().then(snapshot => {
    snapshot.forEach(doc => {
      const shop = doc.data();

      const li = document.createElement("li");
      li.innerHTML = `
        ${shop.name} (${shop.location})
        <button onclick="editShop('${doc.id}', '${shop.name}', '${shop.location}')" class="edit-btn">Edit</button>
        <button onclick="deleteShop('${doc.id}')" class="delete-btn">Delete</button>
      `;

      list.appendChild(li);
    });
  });
}

function editShop(id, oldName, oldLocation) {
  const newName = prompt("Enter new shop name:", oldName);
  const newLocation = prompt("Enter new location:", oldLocation);

  if (!newName || !newLocation) return;

  db.collection("shops").doc(id).update({
    name: newName,
    location: newLocation
  }).then(() => {

    logAction("Update Shop", `Updated to: ${newName}`);
    loadShops();
    loadShopDropdowns();
  });
}

function deleteShop(id) {
  if (!confirm("Delete this shop?")) return;

  db.collection("shops").doc(id).delete()
    .then(() => {

      logAction("Delete Shop", `Shop ID: ${id}`);
      loadShops();
      loadShopDropdowns();
    });
}

function loadShopDropdowns() {
  const productShop = document.getElementById("productShop");
  const offerShop = document.getElementById("offerShop");

  productShop.innerHTML = "<option>Select Shop</option>";
  offerShop.innerHTML = "<option>Select Shop</option>";

  db.collection("shops").get().then(snapshot => {
    snapshot.forEach(doc => {
      const option1 = document.createElement("option");
      option1.value = doc.id;
      option1.text = doc.data().name;
      productShop.appendChild(option1);

      const option2 = document.createElement("option");
      option2.value = doc.id;
      option2.text = doc.data().name;
      offerShop.appendChild(option2);
    });
  });
}

function addProduct() {
  const name = document.getElementById("productName").value;
  const price = document.getElementById("productPrice").value;
  const category = document.getElementById("productCategory").value;
  const shopId = document.getElementById("productShop").value;

  if (!name || !price || !category || shopId === "Select Shop") {
    alert("Fill product details");
    return;
  }

  db.collection("products").add({
    name,
    price,
    category,
    shopId,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {

    logAction("Create Product", `Product: ${name}`);

    loadProducts();
  });
}

function loadProducts() {
  const list = document.getElementById("productList");
  list.innerHTML = "";

  db.collection("products").get().then(snapshot => {
    snapshot.forEach(doc => {
      const p = doc.data();

      const li = document.createElement("li");
      li.innerHTML = `
        ${p.name} - ₹${p.price} (${p.category})
        <button onclick="editProduct('${doc.id}', '${p.name}', '${p.price}', '${p.category}')" class="edit-btn">Edit</button>
        <button onclick="deleteProduct('${doc.id}')" class="delete-btn">Delete</button>
      `;

      list.appendChild(li);
    });
  });
}

function editProduct(id, oldName, oldPrice, oldCategory) {
  const newName = prompt("Enter new name:", oldName);
  const newPrice = prompt("Enter new price:", oldPrice);
  const newCategory = prompt("Enter new category:", oldCategory);

  if (!newName || !newPrice || !newCategory) return;

  db.collection("products").doc(id).update({
    name: newName,
    price: newPrice,
    category: newCategory
  }).then(() => {

    logAction("Update Product", `Updated to: ${newName}`);
    loadProducts();
  });
}

function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;

  db.collection("products").doc(id).delete()
    .then(() => {

      logAction("Delete Product", `Product ID: ${id}`);
      loadProducts();
    });
}

function addOffer() {
  const title = document.getElementById("offerTitle").value;
  const discount = document.getElementById("offerDiscount").value;
  const validTill = document.getElementById("offerValidTill").value;
  const shopId = document.getElementById("offerShop").value;

  if (!title || !discount || !validTill || shopId === "Select Shop") {
    alert("Fill offer details");
    return;
  }

  db.collection("offers").add({
    title,
    discount,
    validTill,
    shopId,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {

    logAction("Create Offer", `Offer: ${title}`);
    loadOffers();
  });
}

function loadOffers() {
  const list = document.getElementById("offerList");
  list.innerHTML = "";

  db.collection("offers").get().then(snapshot => {
    snapshot.forEach(doc => {
      const o = doc.data();

      const li = document.createElement("li");
      li.innerHTML = `
        ${o.title} - ${o.discount}% (till ${o.validTill})
        <button onclick="editOffer('${doc.id}', '${o.title}', '${o.discount}', '${o.validTill}')" class="edit-btn">Edit</button>
        <button onclick="deleteOffer('${doc.id}')" class="delete-btn">Delete</button>
      `;

      list.appendChild(li);
    });
  });
}

function editOffer(id, oldTitle, oldDiscount, oldValidTill) {
  const newTitle = prompt("Enter new title:", oldTitle);
  const newDiscount = prompt("Enter new discount:", oldDiscount);
  const newValidTill = prompt("Enter new date:", oldValidTill);

  if (!newTitle || !newDiscount || !newValidTill) return;

  db.collection("offers").doc(id).update({
    title: newTitle,
    discount: newDiscount,
    validTill: newValidTill
  }).then(() => {

    logAction("Update Offer", `Updated to: ${newTitle}`);
    loadOffers();
  });
}

function deleteOffer(id) {
  if (!confirm("Delete this offer?")) return;

  db.collection("offers").doc(id).delete()
    .then(() => {

      logAction("Delete Offer", `Offer ID: ${id}`);
      loadOffers();
    });
}


async function loadDashboardStats() {

  const shopsSnapshot = await db.collection("shops").get();
  document.getElementById("totalShops").textContent =
    shopsSnapshot.size;

  const productsSnapshot = await db.collection("products").get();
  document.getElementById("totalProducts").textContent =
    productsSnapshot.size;

  const offersSnapshot = await db.collection("offers").get();
  document.getElementById("totalOffers").textContent =
    offersSnapshot.size;

  const usersSnapshot = await db.collection("users").get();
  document.getElementById("totalUsers").textContent =
    usersSnapshot.size;

  const logsSnapshot = await db.collection("logs").get();
  document.getElementById("totalLogs").textContent =
    logsSnapshot.size;

  let revenue = 0;

  logsSnapshot.forEach(doc => {
    const log = doc.data();

    if (log.action === "Checkout") {
      const amount = log.details.replace(/[^\d]/g, "");
      revenue += Number(amount);
    }
  });

  document.getElementById("totalRevenue").textContent =
    "₹" + revenue;
}