# PhotoLelo 📸

> Grab your pictures, the smart way.

PhotoLelo is a powerful photo retrieval system built for events. Photographers upload all event photos once — attendees scan their face and instantly get every photo they appear in. No manual sorting, no WhatsApp floods, no hassle.

---

## The Problem

After photographing an event, the photographer gets flooded with messages from attendees asking for their photos. Manually finding and sending photos of each individual person is incredibly time-consuming.

## The Solution

PhotoLelo automates this entirely:

- Photographer uploads all photos to a private event space
- Each face in every photo is detected and indexed automatically
- Attendees open a shared link, scan their face via webcam
- The app instantly returns every photo they appear in

---

## Demo

> 🔗 [https://photo-lelo.vercel.app/](https://photo-lelo.vercel.app/)

---

## Screenshots

> Add screenshots here after deployment

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Face Detection | face-api.js (TinyFaceDetector) |
| Face Recognition | face-api.js (FaceRecognitionNet) |
| Cloud Storage | Cloudinary |
| Database | Firebase Realtime Database |
| Authentication | Firebase Authentication |
| Hosting | Vercel (coming soon) |

---

## How It Works

### Photographer Flow

1. Signs up / logs in via Firebase Authentication
2. Creates an event with a unique event ID
3. Uploads all event photos via drag & drop
4. For each photo — face-api.js detects all faces and generates 128-number descriptors
5. Descriptors + Cloudinary URLs saved to Firebase
6. Shares the guest link with attendees

### Attendee Flow

1. Opens the guest link (no login required)
2. face-api.js models load automatically in the browser
3. Webcam turns on — attendee clicks "Scan my face"
4. Their face generates a 128-number descriptor
5. Descriptor compared against all stored descriptors using Euclidean distance
6. Photos where distance &lt; 0.5 are considered matches
7. Matching photos shown with individual and bulk download options

### Why face-api.js?

face-api.js runs entirely in the browser — no face data is ever sent to a server. The face scan happens locally on the attendee's device, which makes the system privacy-friendly by design.

---

## How to Run Locally

### Prerequisites

- A Cloudinary account (free tier works)
- A Firebase project with Realtime Database and Authentication enabled

### Steps

1. Clone the repository

```bash
git clone https://github.com/arnav-sengar/Media-Sharing-Application.git
cd PhotoLelo
```

2. Download face-api.js model weights and place them in a `/models` folder:

- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`
- `face_recognition_model-shard2`

Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

3. Update your Firebase config in `js/firebase.js` and `js/firebase-guest.js`

4. Update your Cloudinary credentials in `js/admin.js`:

```javascript
const CLOUDINARY_CLOUD_NAME = "your-cloud-name";
const CLOUDINARY_UPLOAD_PRESET = "your-upload-preset";
```

5. Open with Live Server in VS Code or any local server

---

## Known Limitations & Future Improvements

| Limitation | Future Fix |
| --- | --- |
| Deleting an event removes Firebase data but not Cloudinary images | Implement Cloudinary delete API via Firebase Cloud Functions |
| Face matching threshold is fixed at 0.5 | Allow photographer to adjust sensitivity per event |
| No email notification to attendees | Add email delivery via SendGrid or Firebase Extensions |
| Photos stored locally in browser during session | Full cloud sync with real-time updates |
| Single photographer per account | Team/agency accounts with multiple photographers |

---

## Author

**Arnav Singh**

Built from scratch as a project — inspired by a real problem faced while photographing a college event.

---

## License

MIT