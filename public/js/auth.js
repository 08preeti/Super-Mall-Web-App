function signup() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(async (userCredential) => {

      const user = userCredential.user;

      console.log("Auth created:", user.uid);

      await db.collection("users").doc(user.uid).set({
        email: user.email,
        role: "user",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      console.log("Firestore user document created ✅");

      alert("Signup successful!");
      window.location.href = "login.html";

    })
    .catch((error) => {
      console.error(error);
      alert(error.message);
    });
}


function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(async (userCredential) => {

      const user = userCredential.user; 

      console.log("Logged in:", user.uid);

      const userDoc = await db.collection("users").doc(user.uid).get();

      if (!userDoc.exists) {
        alert("User not found in Firestore");
        return;
      }

      const role = userDoc.data().role;

      if (role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "user.html";
      }

    })
    .catch((error) => {
      alert(error.message);
    });
}
