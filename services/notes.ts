import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { auth } from './firebaseConfig';

export const createNote = async (noteData: any) => {
	const uid = auth.currentUser?.uid;
	if (!uid) return;

	await addDoc(collection(db, 'notes'), {
		...noteData,
		userId: uid
	});
};
