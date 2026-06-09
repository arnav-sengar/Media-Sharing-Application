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
  await matchPhotos(userDescriptor);// now we pass that scanned fingerprint to matchPhotos to compare with all stored photos
}

async function matchPhotos(userDescriptor) {

  if (!EVENT_ID) {
    scanStatus.textContent =
      "Invalid event link.";
    scanBtn.disabled = false;
    return;
  }

  const snapshot = await get(
    ref(
      db,
      `events/${EVENT_ID}/photos`
    )
  );

  if (!snapshot.exists()) {
    scanStatus.textContent =
      "No photos found for this event.";
    scanBtn.disabled = false;
    return;
  }

  const photosObj = snapshot.val();

  const photos = Object.values(photosObj);

  const matches = [];

  photos.forEach(function (photo) {

    if (!photo.descriptors) return;

    photo.descriptors.forEach(function (descriptor) {

      const dist =
        faceapi.euclideanDistance(
          userDescriptor,
          descriptor
        );

      if (dist < 0.5) {
        matches.push(photo.src);
      }

    });

  });

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
  document.getElementById("scan-screen").style.display = "none";
  document.getElementById("results-screen").style.display = "block";

  const grid = document.getElementById("results-grid");
  const count = document.getElementById("results-count");

  if (matches.length === 0) {
    count.textContent = "No photos found with your face.";
    return;
  }

  count.textContent = matches.length + " photo(s) found with you in them!";

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
  document.getElementById("scan-screen").style.display = "block";
  scanBtn.disabled = false;
  scanStatus.textContent = "Camera ready. Click Scan my face.";
}

// this starts everything
// as soon as the guest lands on the scan page...models start loading so that user ko wait na krna pade when they click scan
loadModels();
