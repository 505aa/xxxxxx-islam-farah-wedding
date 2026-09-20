/* =====================================================================
   Firebase configuration — fill this in and the wishes wall (below the
   invitation) will save every wish live to your own Firebase project,
   so you and Farah/Islam can see every wish as it comes in, from any
   device. Each guest can also delete their own wish (and only theirs).

   SETUP (free, ~5 minutes):

   1. https://console.firebase.google.com → "Add project" → name it
      anything (e.g. "islam-farah-wedding") → you can skip Google
      Analytics → Create project.

   2. Build → Firestore Database → Create database → choose a location
      close to your guests → start in "production mode".

   3. Build → Authentication → Get started → Sign-in method tab →
      enable "Anonymous". (This silently gives each visitor's browser
      its own private ID — no login screen, no email, nothing the
      guest has to do. It's only used so a guest can delete their own
      wish and nobody else's.)

   4. Firestore Database → Rules tab → replace everything with this,
      then click Publish:

        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /wishes/{wishId} {
              allow read: if true;
              allow create: if request.auth != null
                            && request.resource.data.ownerId == request.auth.uid
                            && request.resource.data.name is string
                            && request.resource.data.name.size() < 40
                            && request.resource.data.text is string
                            && request.resource.data.text.size() > 0
                            && request.resource.data.text.size() < 400;
              allow delete: if request.auth != null
                            && request.auth.uid == resource.data.ownerId;
              allow update: if false;
            }
          }
        }

   5. Project settings (the gear icon, top left) → General tab → scroll
      to "Your apps" → click the </> (Web) icon → give it any nickname
      → Register app. It will show a firebaseConfig object — copy the
      values into the object below (replace every "YOUR_..." placeholder).

   That's it — no server, no backend to maintain. Firebase's free tier
   is very generous and easily covers a wedding site's traffic.
   ===================================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyC5v0HUOptP4QnxK0gM_xKutx9PpejRFnQ",
  authDomain: "islam-farah--wedding.firebaseapp.com",
  projectId: "islam-farah--wedding",
  storageBucket: "islam-farah--wedding.firebasestorage.app",
  messagingSenderId: "525260501592",
  appId: "1:525260501592:web:7e7dd4f685fdaa16ad102d"
};
