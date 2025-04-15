import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { auth } from './firebaseConfig';

export const toggleFavorite = async (astro: string) => {
	const uid = auth.currentUser?.uid;
	if (!uid) return;

	const userRef = doc(db, 'users', uid);
	const userSnap = await getDoc(userRef);

	if (!userSnap.exists()) {
		await setDoc(userRef, { favorites: [astro] });
	} else {
		const currentFavs = userSnap.data().favorites || [];
		if (currentFavs.includes(astro)) {
			await updateDoc(userRef, {
				favorites: arrayRemove(astro)
			});
		} else {
			await updateDoc(userRef, {
				favorites: arrayUnion(astro)
			});
		}
	}
};

export const getFavorites = async () => {
	const uid = auth.currentUser?.uid;
	if (!uid) return [];
	const userRef = doc(db, 'users', uid);
	const userSnap = await getDoc(userRef);
	return userSnap.data()?.favorites || [];
};
