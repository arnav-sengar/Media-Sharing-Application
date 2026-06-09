import { db, ref, set, push } from "./firebase.js";
const CLOUDINARY_CLOUD_NAME = "deg0hgtgb";
const CLOUDINARY_UPLOAD_PRESET = "ue45bpd3";

const ADMIN_MODEL_URL = "./models";

let currentEventId = null;

function generateEventId() {
  return "EVT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

window.createPhotoEvent = async function () {
  const name = document.getElementById("eventname").value;

  if (!name) {
    alert("Enter event name");
    return;
  }

  const eventId = generateEventId();

  await set(ref(db, "events/" + eventId), {
    eventName: name,
    createdAt: Date.now(),
  });

  currentEventId = eventId;

  document.getElementById("eventid").textContent = "Created: " + eventId;

  alert("Event created!");
};

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

async function loadAdminModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri(ADMIN_MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(ADMIN_MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(ADMIN_MODEL_URL);
  console.log("Admin models loaded");
}

loadAdminModels();

window.checkpassword = function () {
  const input = document.getElementById("passcode").value;
  const error = document.getElementById("lockerror");

  if (input == "photo123") {
    document.getElementById("lockscreen").style.display = "none";
    document.getElementById("adminpanel").style.display = "block";
  } else {
    error.style.display = "block";
  }
};

window.logout = function () {
  document.getElementById("adminpanel").style.display = "none";
  document.getElementById("lockscreen").style.display = "flex";
  document.getElementById("passcode").value = "";
  document.getElementById("lockerror").style.display = "none";
};

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

// function to handle the uploaded files

function handleFiles(files) {
  Array.from(files).forEach(async function (file) {
    if (!file.type.startsWith("image/")) return;

    // upload to cloudinary first
    const cloudinaryUrl = await uploadToCloudinary(file);

    // then read locally for display and face detection
    const reader = new FileReader();
    reader.onload = function (e) {
      addPhototoGrid(cloudinaryUrl, e.target.result, file.name);
    };
    reader.readAsDataURL(file);
  });
}

// jo bhi pictures upload ki h...unko properly grid mein show karna

async function addPhototoGrid(cloudinaryUrl, localSrc, name) {
  if (emptymessage) emptymessage.remove();

  const div = document.createElement("div");
  div.className = "photoitem";
  div.innerHTML = `<img src="${localSrc}" alt="${name}" />`;
  photoGrid.appendChild(div);

  // detect faces using local src
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

  // save cloudinary url + descriptors to localStorage
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

// generating a copy link

window.copylink = function () {
  const link = document.getElementById("sharelink").value;
  navigator.clipboard.writeText(link);

  const toast = document.getElementById("copy-toast");
  toast.style.opacity = "1";

  setTimeout(function () {
    toast.style.opacity = "0";
  }, 2000);
};

window.togglePassword = function () {
  const input = document.getElementById("passcode");
  if (input.type === "password") {
    input.type = "text";
  } else {
    input.type = "password";
  }
};
