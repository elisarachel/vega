import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import PageHeader from '@/components/PageHeader';
import IconButton from '@/components/Button';

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;

export default function DiarioHome() {
	type Note = {
		id: string;
		date?: string;
		texto?: string;
	};

	const [notes, setNotes] = useState<Note[]>([]);
	const router = useRouter();
	const db = getFirestore();
	const user = getAuth().currentUser;

	useEffect(() => {
		if (user) {
			const fetchNotes = async () => {
				const notesQuery = query(
					collection(db, 'notas'),
					where('uid', '==', user.uid)
				);
				const snapshot = await getDocs(notesQuery);
				const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
				setNotes(data);
			};
			fetchNotes();
		}
	}, [user]);

	return (
		<View style={styles.container}>

			<PageHeader
				background={require('@/assets/images/header2.png')}
				icon={require('@/assets/images/calendar_icon2.png')}
				text="Diário de observação"
			/>

			<FlatList
				data={notes}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View style={styles.noteCard}>
						<Text style={styles.noteDate}>{item.date}</Text>
						<Text style={styles.notePreview} numberOfLines={2}>
							{item.texto}
						</Text>
					</View>
				)}
			/>

			<IconButton
				image={require('@/assets/images/pink_button.png')}
				text="Nova Nota +"
				onPress={() => router.push('/(modals)/note/[note]')}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#E9ECF5',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 20,
		color: '#18122B',
	},
	noteCard: {
		backgroundColor: '#fff',
		borderRadius: 8,
		padding: 16,
		marginBottom: 12,
		elevation: 2,
	},
	noteDate: {
		fontSize: 12,
		color: '#888',
		marginBottom: 4,
	},
	notePreview: {
		fontSize: 14,
		color: '#18122B',
	},
	newNoteButton: {
		padding: Math.round(16*scaleFactor),
	},
	newNoteText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
