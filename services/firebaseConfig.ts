import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import Constants from "expo-constants";


const firebaseConfig = {
	apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY || "",
	authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN || "",
	projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID || "",
	storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET || "",
	messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID || "",
	appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID || ""
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
	persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };