import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
  apiKey: "AIzaSyCtr-9ckvn1zerveFzUD5SQYxTnFtnUZzM",
  authDomain: "whatapp-a3d83.firebaseapp.com",
  projectId: "whatapp-a3d83",
  storageBucket: "whatapp-a3d83.firebasestorage.app",
  messagingSenderId: "768530357358",
  appId: "1:768530357358:web:8e683f86ae914658259a7f",
  measurementId: "G-9CBELRY0C0",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
