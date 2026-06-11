import { db, ref, get } from "./firebase-guest.js";
const params = new URLSearchParams(window.location.search);
const EVENT_ID = params.get("event");

console.log("Current Event:", EVENT_ID);

//where to find AI models files
const MODEL_URL = "./models";

const video = document.getElementById("video");
const scanBtn = document.getElementById("scan-btn");
const scanStatus = document.getElementById("scan-status");

// async use kiya kyunki ye function jyada time lega for completion
async function loadModels() {
  scanStatus.textContent = "Loading face detection models...";

  // await kyunki jab tak ek line na complete ho jaye fully tab tak don't go to next line
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL); // finds face in an image
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL); // maps 68 points on the face
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL); // converts the face into a 128 number fingerprint known as descriptor
  scanStatus.textContent = "Models loaded. Starting camera...";
  startCamera();
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true }); // getUserMedia ek built-in browser api h jo camera permission mangti h
    video.srcObject = stream;
    scanStatus.textContent = "Camera ready. Click Scan my face.";
  } catch (err) {
    scanStatus.textContent = "Camera access denied. Please allow camera.";
  }
}

window.startScan = async function () {
  scanStatus.textContent = "Scanning your face...";
  scanBtn.disabled = true; // jab already scan ho rha hota h toh 50 baar click nhi karne  deta...just a good practice

  console.log("Scan started");
  console.log("Video ready state:", video.readyState);
  console.log("Video dimensions:", video.videoWidth, video.videoHeight);

  const detection = await Promise.race([
    faceapi
      .detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.5,
        }), // webcam ki feed ek face identify karta h
      )
      .withFaceLandmarks() // maps 68 points on that face
      .withFaceDescriptor(), // generates 128 number fingerprint for that face
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Detection timeout")), 10000),
    ),
  ]).catch(function (err) {
    console.log("Detection error:", err.message);
    return null;
  });

  console.log("Detection result:", detection);

  if (!detection) {
    scanStatus.textContent = "No face detected. Please try again.";
    scanBtn.disabled = false; // agar face nhi detect kar paya us try mein...toh scan button wapas enable kar denge
    return;
  }

  scanStatus.textContent = "Face found! Searching your photos...";
  const userDescriptor = detection.descriptor; // woh 128 number fingerprint ko ek variable mein store kar rhe
  await matchPhotos(userDescriptor); // now we pass that scanned fingerprint to matchPhotos to compare with all stored photos
};

async function matchPhotos(userDescriptor) {
  if (!EVENT_ID) {
    scanStatus.textContent = "Invalid event link.";
    scanBtn.disabled = false;
    return;
  }

  const snapshot = await get(ref(db, `events/${EVENT_ID}/photos`));

  if (!snapshot.exists()) {
    scanStatus.textContent = "No photos found for this event.";
    scanBtn.disabled = false;
    return;
  }

  const photosObj = snapshot.val();
  const photos = Object.values(photosObj);

  // debug logs
  console.log("Photos from Firebase:", photos.length);
  console.log("First photo descriptors:", photos[0]?.descriptors);

  const matches = [];

  // now this part might confuse you...
  // lemme try easily samjhane ka
  // dekhoo....ho sakta h ek photo mein kayi saare log ho...toh us photo mein har insaan ke face ke liye ek descriptor banega
  // isliye we have done -
  // storage se saari photos nikali -> har photo mein jitne bhi descriptor h sabse guest ke descriptor ko match kiya -> if matches toh use push kar diya matches wale array mein
  // get it??
  photos.forEach(function (photo) {
    if (!photo.descriptors) return;
    console.log("descriptor type:", typeof photo.descriptors[0]);
    console.log("descriptor sample:", photo.descriptors[0]);
    let matched = false;
    photo.descriptors.forEach(function (descriptor) {
      if (matched) return;
      const float32 = new Float32Array(
        Array.isArray(descriptor) ? descriptor : Object.values(descriptor),
      );
      const dist = faceapi.euclideanDistance(userDescriptor, float32);
      if (dist < 0.5) {
        matched = true;
      }
    });

    if (matched) matches.push(photo.src);
  });
  console.log("Total matches found:", matches.length);
  showResults(matches);
}

async function downloadPhoto(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = "photolelo-" + Date.now() + ".jpg";
  a.click();

  URL.revokeObjectURL(blobUrl);
}

function showResults(matches) {
  console.log("showResults called, matches:", matches.length);
  console.log("matches:", matches);

  document.getElementById("scan-screen").style.display = "none";
  const resultsScreen = document.getElementById("results-screen");
  resultsScreen.classList.remove("hidden");
  resultsScreen.style.display = "block";

  const grid = document.getElementById("results-grid");
  const count = document.getElementById("results-count");

  if (matches.length === 0) {
    count.textContent = "No photos found with your face.";
    return;
  }

  count.textContent = matches.length + " photo(s) found with you in them!";

  const downloadAllBtn = document.createElement("button");
  downloadAllBtn.textContent = "Download All";
  downloadAllBtn.className = "btn btn-primary download-all-btn";
  downloadAllBtn.onclick = async function () {
    downloadAllBtn.textContent = "Downloading...";
    downloadAllBtn.disabled = true;
    for (const src of matches) {
      await downloadPhoto(src);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    downloadAllBtn.textContent = "Download All";
    downloadAllBtn.disabled = false;
  };
  grid.parentElement.insertBefore(downloadAllBtn, grid);

  matches.forEach(function (src) {
    const div = document.createElement("div");
    div.className = "result-item";
    div.innerHTML = `<img src="${src}" />`;

    const btn = document.createElement("button");
    btn.textContent = "Download";
    btn.className = "download-btn";
    btn.onclick = function () {
      downloadPhoto(src);
    };

    div.appendChild(btn);
    grid.appendChild(div);
  });
}

// reset everything to initial
window.rescan = function () {
  document.getElementById("results-screen").style.display = "none";
  document.getElementById("scan-screen").style.display = "flex";
  scanBtn.disabled = false;
  scanStatus.textContent = "Camera ready. Click Scan my face.";

  // clear previous results
  document.getElementById("results-grid").innerHTML = "";
  document.getElementById("results-count").textContent =
    "Looking through the event photos...";
  const existingBtn = document.querySelector(".download-all-btn");
  if (existingBtn) existingBtn.remove();

};

window.submitEventLink = function () {
  const input = document.getElementById("event-link-input").value.trim();

  if (!input) {
    document.getElementById("link-error").style.display = "block";
    return;
  }

  try {
    const url = new URL(input);
    const eventId = url.searchParams.get("event");

    if (!eventId) {
      document.getElementById("link-error").style.display = "block";
      return;
    }

    // redirect to guest page with event ID
    window.location.href = "guest.html?event=" + eventId;
  } catch (err) {
    document.getElementById("link-error").style.display = "block";
  }
};

// agar event ID nhi h URL mein toh link screen dikhao
// warna seedha camera start karo
if (!EVENT_ID) {
  document.getElementById("link-screen").style.display = "flex";
  document.getElementById("scan-screen").style.display = "none";
} else {
  document.getElementById("link-screen").style.display = "none";
  document.getElementById("scan-screen").style.display = "flex";
  loadModels();
}
