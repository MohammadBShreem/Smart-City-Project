import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAeDhrqwyw7Hv1pzBQ7qL-Acfv0FClZelw",
    authDomain: "smart-city-project-2d56f.firebaseapp.com",
    databaseURL: "https://smart-city-project-2d56f-default-rtdb.firebaseio.com",
    projectId: "smart-city-project-2d56f",
    storageBucket: "smart-city-project-2d56f.firebasestorage.app",
    messagingSenderId: "424897509713",
    appId: "1:424897509713:web:54abf259c177f9abbefb70",
    measurementId: "G-YXFDPFP0Z4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
