import { db, ref, set, push, get, remove } from "./firebase.js";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "./firebase-auth.js";

const CLOUDINARY_CLOUD_NAME = "deg0hgtgb";
const CLOUDINARY_UPLOAD_PRESET = "ue45bpd3";
const ADMIN_MODEL_URL = "./models";

let currentEventId = null;

function generateEventId() {
  return "EVT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// === AUTH FUNCTIONS ===
window.switchTab = function (tab) {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const tabs = document.querySelectorAll(".auth-tab");

  if (tab === "login") {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    tabs[0].classList.add("active");
    tabs[1].classList.remove("active");
  } else {
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    tabs[1].classList.add("active");
    tabs[0].classList.remove("active");
  }
};

window.loginPhotographer = async function () {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const error = document.getElementById("login-error");

  try {
    await signInWithEmailAndPassword(auth, email, password);
    document.getElementById("lockscreen").style.display = "none";
    document.getElementById("adminpanel").style.display = "block";
    loadEvents();
  } catch (err) {
    error.style.display = "block";
    error.textContent = err.message;
  }
};

window.signupPhotographer = async function () {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const error = document.getElementById("signup-error");

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    document.getElementById("lockscreen").style.display = "none";
    document.getElementById("adminpanel").style.display = "block";
    loadEvents();
  } catch (err) {
    error.style.display = "block";
    error.textContent = err.message;
  }
};

window.logout = async function () {
  await signOut(auth);
  document.getElementById("adminpanel").style.display = "none";
  document.getElementById("lockscreen").style.display = "flex";
};

window.togglePassword = function (inputId) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
};

// === EVENT FUNCTIONS ===
window.createPhotoEvent = async function () {
  const name = document.getElementById("eventname").value;

  if (!name) {
    document.getElementById("eventname-error").style.display = "block";
    return;
  }
  document.getElementById("eventname-error").style.display = "none";

  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in.");
    return;
  }

  const eventId = generateEventId();

  await set(ref(db, "events/" + eventId), {
    eventName: name,
    createdAt: Date.now(),
    uid: user.uid,
  });

  currentEventId = eventId;

  // clear photo grid for new event
  const photoGrid = document.getElementById("photogrid");
  photoGrid.innerHTML = '<p id="emptymsg" style="font-size:13px; color:#aaa;">No photos uploaded yet.</p>';

  // clear event name input
  document.getElementById("eventname").value = "";

  // show success message
  const eventIdEl = document.getElementById("eventid");
  eventIdEl.textContent = "✓ Event created — " + eventId;
  eventIdEl.style.color = "#0F6E56";

  const guestLink = window.location.origin + "/guest.html?event=" + eventId;
  document.getElementById("sharelink").value = guestLink;

  loadEvents();
};

// === CLOUDINARY ===
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData },
  );

  const data = await response.json();
  console.log("Cloudinary upload:", data.secure_url);
  return data.secure_url;
}

// === FACE API MODELS ===
async function loadAdminModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri(ADMIN_MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(ADMIN_MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(ADMIN_MODEL_URL);
  console.log("Admin models loaded");
}

loadAdminModels();

// === FILE UPLOAD ===
const fileInput = document.getElementById("fileinput");
const dropzone = document.getElementById("dropzone");
const photoGrid = document.getElementById("photogrid");
const emptymessage = document.getElementById("emptymsg");

fileInput.addEventListener("change", function () {
  handleFiles(this.files);
});

dropzone.addEventListener("dragover", function (e) {
  e.preventDefault();
  dropzone.style.borderColor = "#3c3489";
});

dropzone.addEventListener("dragleave", function () {
  dropzone.style.borderColor = "#ccc";
});

dropzone.addEventListener("drop", function (e) {
  e.preventDefault();
  dropzone.style.borderColor = "#ccc";
  handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
  Array.from(files).forEach(async function (file) {
    if (!file.type.startsWith("image/")) return;

    const cloudinaryUrl = await uploadToCloudinary(file);

    const reader = new FileReader();
    reader.onload = function (e) {
      addPhototoGrid(cloudinaryUrl, e.target.result, file.name);
    };
    reader.readAsDataURL(file);
  });
}

async function addPhototoGrid(cloudinaryUrl, localSrc, name) {
  const emptyMsg = document.getElementById("emptymsg");
  if (emptyMsg) emptyMsg.remove();

  const div = document.createElement("div");
  div.className = "photoitem";
  div.innerHTML = `<img src="${localSrc}" alt="${name}" />`;
  photoGrid.appendChild(div);

  const img = await faceapi.fetchImage(localSrc);
  const detections = await faceapi
    .detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5,
      }),
    )
    .withFaceLandmarks()
    .withFaceDescriptors();

  console.log(`${name}: ${detections.length} face(s) detected`);

  const descriptors = detections.map((d) => Array.from(d.descriptor));

  if (!currentEventId) {
    alert("Create an event first!");
    return;
  }

  await push(ref(db, `events/${currentEventId}/photos`), {
    src: cloudinaryUrl,
    name: name,
    descriptors: descriptors,
  });

  console.log("Photo saved to Firebase");
}

// === COPY LINK ===
window.copylink = function () {
  const link = document.getElementById("sharelink").value;
  const toast = document.getElementById("copy-toast");

  if (!link) {
    toast.textContent = "Please create or select an event first.";
    toast.style.color = "#cc0000";
    toast.style.opacity = "1";
    setTimeout(function () {
      toast.style.opacity = "0";
      setTimeout(function () {
        toast.textContent = "Link copied!";
        toast.style.color = "#0F6E56";
      }, 300);
    }, 2000);
    return;
  }

  navigator.clipboard.writeText(link);
  toast.textContent = "Link copied!";
  toast.style.color = "#0F6E56";
  toast.style.opacity = "1";

  setTimeout(function () {
    toast.style.opacity = "0";
  }, 2000);
};

// === EVENTS LIST ===
async function loadEvents() {
  const user = auth.currentUser;
  if (!user) return;

  const snapshot = await get(ref(db, "events"));
  if (!snapshot.exists()) return;

  const eventsList = document.getElementById("events-list");
  const eventsEmpty = document.getElementById("events-empty");

  if (eventsEmpty) eventsEmpty.remove();
  eventsList.innerHTML = "";

  const eventsObj = snapshot.val();
  const events = Object.entries(eventsObj).sort(
    (a, b) => b[1].createdAt - a[1].createdAt,
  );
  // only show events belonging to this photographer
  const myEvents = events.filter(([id, data]) => data.uid === user.uid);

  if (myEvents.length === 0) {
    eventsList.innerHTML =
      '<p style="font-size:13px; color:#aaa;">No events yet.</p>';
    return;
  }

  myEvents.forEach(function ([eventId, eventData]) {
    const date = new Date(eventData.createdAt).toLocaleDateString();
    const guestLink =
      window.location.origin + "/guest.html?event=" + eventId;

    const div = document.createElement("div");
    div.className = "event-item";
    div.id = "event-" + eventId;
    div.innerHTML = `
      <div>
        <div class="event-item-name">${eventData.eventName}</div>
        <div class="event-item-meta">${eventId} · ${date}</div>
      </div>
      <div class="event-item-right">
        <button class="event-select-btn" onclick="selectEvent('${eventId}', '${eventData.eventName}', '${guestLink}')">Select</button>
        <button class="event-delete-btn" onclick="deleteEvent('${eventId}')">Delete</button>
      </div>
    `;
    eventsList.appendChild(div);
  });
}

window.selectEvent = function (eventId, eventName, guestLink) {
  currentEventId = eventId;

  document.getElementById("sharelink").value = guestLink;
  document.getElementById("eventid").textContent =
    "Active: " + eventName + " (" + eventId + ")";

  document.querySelectorAll(".event-item").forEach(function (item) {
    item.classList.remove("active");
  });
  document.getElementById("event-" + eventId).classList.add("active");

  console.log("Selected event:", eventId);
  loadEventPhotos(eventId);
};

window.deleteEvent = async function (eventId) {
  const confirm = window.confirm("Delete this event? This cannot be undone.");
  if (!confirm) return;

  await remove(ref(db, "events/" + eventId));

  const item = document.getElementById("event-" + eventId);
  if (item) item.remove();

  if (currentEventId === eventId) {
    currentEventId = null;
    document.getElementById("sharelink").value = "";
    document.getElementById("eventid").textContent = "No event created";
  }

  console.log("Event deleted:", eventId);
};

async function loadEventPhotos(eventId) {
  const photoGrid = document.getElementById("photogrid");
  photoGrid.innerHTML = "<p>Loading photos...</p>";

  const snapshot = await get(ref(db, "events/" + eventId + "/photos"));

  if (!snapshot.exists()) {
    photoGrid.innerHTML =
      '<p id="emptymsg" style="font-size:13px; color:#aaa;">No photos uploaded yet.</p>';
    return;
  }

  photoGrid.innerHTML = "";

  const photosObj = snapshot.val();
  Object.values(photosObj).forEach(function (photo) {
    const div = document.createElement("div");
    div.className = "photoitem";
    div.innerHTML = `<img src="${photo.src}" alt="${photo.name}" />`;
    photoGrid.appendChild(div);
  });
}
