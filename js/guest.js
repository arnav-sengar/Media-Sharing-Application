//where to find AI models files
const MODEL_URL = './models';

const video = document.getElementById('video');
const scanBtn = document.getElementById('scan-btn');
const scanStatus = document.getElementById('scan-status');


// async use kiya kyunki ye function jyada time lega for completion
async function loadModels() {
  scanStatus.textContent = 'Loading face detection models...';

  // await kyunki jab tak ek line na complete ho jaye fully tab tak don't go to next line
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL); // finds face in an image
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL); // maps 68 points on the face
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL); // converts the face into a 128 number fingerprint known as descriptor
  scanStatus.textContent = 'Models loaded. Starting camera...';
  startCamera();
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true }); // getUserMedia ek built-in browser api h jo camera permission mangti h
    video.srcObject = stream;
    scanStatus.textContent = 'Camera ready. Click Scan my face.';
  } catch (err) {
    scanStatus.textContent = 'Camera access denied. Please allow camera.';
  }
}

async function startScan() {
  scanStatus.textContent = 'Scanning your face...';
  scanBtn.disabled = true; // jab already scan ho rha hota h toh 50 baar click nhi karne  deta...just a good practice

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()) // webcam ki feed ek face identify karta h
    .withFaceLandmarks() // maps 68 points on that face
    .withFaceDescriptor(); // generates 128 number fingerprint for that face

  if (!detection) {
    scanStatus.textContent = 'No face detected. Please try again.';
    scanBtn.disabled = false; // agar face nhi detect kar paya us try mein...toh scan button wapas enable kar denge
    return;
  }

  scanStatus.textContent = 'Face found! Searching your photos...';
  const userDescriptor = detection.descriptor; // woh 128 number fingerprint ko ek variable mein store kar rhe
  matchPhotos(userDescriptor); // now we pass that scanned fingerprint to matchPhotos to compare with all stored photos
}

function matchPhotos(userDescriptor) {
  const stored = localStorage.getItem('photolelo_photos'); // retrieves the photo the uploaded by the photographer 
  if (!stored) {
    scanStatus.textContent = 'No photos found in this event.';
    scanBtn.disabled = false;
    return;  // agar koi photo nhi stored h us link par...toh just message deke  return kar de rha
  }

  const photos = JSON.parse(stored); // photos jo string ke form mein h in 'stored' usko ek array mein convert kardiya named 'photos'
  const matches = []; // to store the matched photos

  // now this part might confuse you...
  // lemme try easily samjhane ka
  // dekhoo....ho sakta h ek photo mein kayi saare log ho...toh us photo mein har insaan ke face ke liye ek descriptor banega
  // isliye we have done - 
  // storage se saari photos nikali -> har photo mein jitne bhi descriptor h sabse guest ke descriptor ko match kiya -> if matches toh use push kar diya matches wale array mein
  // get it??
  photos.forEach(function(photo) {
    if (!photo.descriptors) return;
    photo.descriptors.forEach(function(descriptor) {
      const dist = faceapi.euclideanDistance(userDescriptor, descriptor); // dono face descriptors ko compare karta h and ek value return karta h
      if (dist < 0.5) { // if woh value 0.5 se kam hui...then we can say ki maybe same person ho
        matches.push(photo.src);
      }
    });
  });

  showResults(matches); // pass that array to showResults function
}

function showResults(matches) {
  document.getElementById('scan-screen').style.display = 'none';
  document.getElementById('results-screen').style.display = 'block';

  const grid = document.getElementById('results-grid');
  const count = document.getElementById('results-count');

  if (matches.length === 0) {
    count.textContent = 'No photos found with your face.';
    return;
  }

  count.textContent = matches.length + ' photo(s) found with you in them!';

  matches.forEach(function(src) {
    const div = document.createElement('div');
    div.className = 'photoitem result-item';
    div.innerHTML = `
      <img src="${src}" />
      <a href="${src}" download class="download-btn">Download</a>
    `;
    grid.appendChild(div);
  });
}

// reset everything to initial
function rescan() {
  document.getElementById('results-screen').style.display = 'none';
  document.getElementById('scan-screen').style.display = 'block';
  scanBtn.disabled = false;
  scanStatus.textContent = 'Camera ready. Click Scan my face.';
}

// this starts everything
// as soon as the guest lands on the scan page...models start loading so that user ko wait na krna pade when they click scan
loadModels();