
var firebaseConfig = {
  apiKey: "AIzaSyCxbH8w8ShHNKXPk_O6dIMBGvXxHSlRgD0",
  authDomain: "super-mall-web-app-2966c.firebaseapp.com",
  projectId: "super-mall-web-app-2966c",
  storageBucket: "super-mall-web-app-2966c.firebasestorage.app",
  messagingSenderId: "765757747617",
  appId: "1:765757747617:web:2107cb453679bbfe05dbe0"
};

firebase.initializeApp(firebaseConfig);


const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase initialized");
