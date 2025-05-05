import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import PageHeader from '@/components/PageHeader';
import PixelLoader from '@/components/LoadingAnimation';

const astroNamesPT: { [key: string]: string } = {
    'Mercury': 'Mercúrio',
    'Venus': 'Vênus',
    'Mars': 'Marte',
    'Jupiter': 'Júpiter',
    'Saturn': 'Saturno',
    'Moon': 'Lua',
    'Sun': 'Sol'
};

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;

export default function VerNota() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const [nota, setNota] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const db = getFirestore();

	useEffect(() => {
		const fetchNota = async () => {
			if (id) {
				const docRef = doc(db, 'notas', id);
				const docSnap = await getDoc(docRef);
				if (docSnap.exists()) {
					setNota(docSnap.data());
				}
				setLoading(false);
			}
		};
		fetchNota();
	}, [id]);

	if (loading) {
		return (
			<View style={{ marginTop: 32, alignItems: 'center' }}>
				<PixelLoader />
			</View>
		);
	}

	if (!nota) {
		return <Text style={{ marginTop: 32 }}>Nota não encontrada</Text>;
	}

	return (
		<ScrollView style={styles.container}>
			<PageHeader
				background={require('@/assets/images/header2_pink.png')}
				icon={require('@/assets/images/notes_icon.png')}
				text="Visualizar Nota"
			/>

			<Text style={styles.label}>Data:</Text>
			<Text style={styles.content}>{nota.data}</Text>

			<Text style={styles.label}>Fase da Lua:</Text>
			<Text style={styles.content}>{nota.faseDaLua}</Text>

			<Text style={styles.label}>Clima:</Text>
			<Text style={styles.content}>{nota.condicaoObservacao}</Text>

			<Text style={styles.label}>Astros selecionados:</Text>
			{(Array.isArray(nota.astrosSelecionados) ? nota.astrosSelecionados.map((astro: string, idx: number) => (
				<Text key={idx} style={styles.content}>• {astroNamesPT[astro] || astro}</Text>
			)) : null)}

			<Text style={styles.label}>Texto:</Text>
			<Text style={styles.content}>{nota.texto}</Text>

			<Text style={styles.label}>Cidade:</Text>
			<Text style={styles.content}>{nota.location}</Text>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#E9ECF5',
	},
	label: {
		fontSize: Math.round(12 * scaleFactor),
		color: '#18122B',
		fontFamily: 'TinyUnicode',
		marginTop: Math.round(4 * scaleFactor),
		marginHorizontal: Math.round(6 * scaleFactor),
	},
	content: {
		marginHorizontal: Math.round(6 * scaleFactor),
		fontSize: Math.round(12 * scaleFactor),
		color: '#7A7D8D',
		fontFamily: 'TinyUnicode',
		marginBottom: Math.round(2 * scaleFactor),
	},
});
