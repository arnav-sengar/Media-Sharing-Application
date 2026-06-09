import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getDatabase,
  ref,
  set,
  push
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAo7Jadb9XUaPYgij36CdSEVVzwSj0ZjIo",
  authDomain: "photo-lelo.firebaseapp.com",
  projectId: "photo-lelo",
  storageBucket: "photo-lelo.firebasestorage.app",
  messagingSenderId: "600322176959",
  appId: "1:600322176959:web:eefa39088167a9e1a0930a",
  databaseURL:
    "https://photo-lelo-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, push };