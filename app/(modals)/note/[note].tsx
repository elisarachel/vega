import React, { useState } from 'react';
import { View, TextInput, Text, Button, ScrollView, StyleSheet, Dimensions, Alert } from 'react-native';
import { DateTime } from 'luxon';
import { MoonPhase } from 'astronomy-engine';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';
import useVisibleAstros from '@/hooks/useVisibleAstros';
import PageHeader from '@/components/PageHeader';
import { Canvas, Image as SkiaImage, useImage } from '@shopify/react-native-skia';

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;

const BOX_HEIGHT = Math.round(20 * scaleFactor); 
const BOX_WIDTH = Math.round(97 * scaleFactor);

export default function NovaNota() {
	const now = DateTime.now();
	const { visibleAstros, location } = useVisibleAstros();

	const [texto, setTexto] = useState('');
	const [selecionados, setSelecionados] = useState<string[]>([]);

	const phase = MoonPhase(new Date());
	const faseDaLua =
		phase < 0.25 ? 'Lua Nova' :
		phase < 0.5 ? 'Lua Crescente' :
		phase < 0.75 ? 'Lua Cheia' :
		'Lua Minguante';

	const toggleAstro = (astro: string) => {
		setSelecionados(prev =>
			prev.includes(astro) ? prev.filter(a => a !== astro) : [...prev, astro]
		);
	};

	const salvarNota = async () => {
		try {
			const user = getAuth().currentUser;
			if (!user) {
				Alert.alert('Erro', 'Usuário não autenticado.');
				return;
			}

			const nota = {
				userId: user.uid,
				data: now.toISODate(),
				texto,
				faseDaLua,
				astrosSelecionados: selecionados,
				location: location ?? null,
				criadoEm: now.toISO()
			};

			await setDoc(doc(db, 'notas', `${user.uid}_${now.toISODate()}`), nota);
			Alert.alert('Sucesso', 'Nota salva com sucesso!');
			setTexto('');
			setSelecionados([]);
		} catch (err) {
			console.error(err);
			Alert.alert('Erro', 'Não foi possível salvar a nota.');
		}
	};

	const textBoxImage = useImage(require('@/assets/images/text_box_edit.png'));

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<PageHeader
				background={require('@/assets/images/header2.png')}
				icon={require('@/assets/images/calendar_icon2.png')}
				text="NovaNota"
			/>
			<Text style={styles.label}>Fase da Lua: {faseDaLua}</Text>

			<Text style={styles.label}>Astros visíveis:</Text>
			{visibleAstros.now.map((astro, idx) => (
				<View key={idx} style={styles.astroContainer}>
					<Canvas style={styles.textBox}>
						{textBoxImage && (
							<SkiaImage
								image={textBoxImage}
								x={0}
								y={0}
								width={BOX_WIDTH}
								height={BOX_HEIGHT}
							/>
						)}
					</Canvas>
					<Text
						style={[
							styles.astroText,
							selecionados.includes(astro.name) && styles.astroSelecionadoText
						]}
						onPress={() => toggleAstro(astro.name)}
					>
						{astro.name}
					</Text>
				</View>
			))}

			<Text style={styles.label}>Escreva sua nota:</Text>
			<TextInput
				multiline
				value={texto}
				onChangeText={setTexto}
				style={styles.textArea}
				placeholder="Hoje eu vi..."
			/>

			<Button title="Salvar Nota" onPress={salvarNota} />
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: Math.round(8 * scaleFactor),
		backgroundColor: '#E9ECF5',
	},
	label: {
		fontSize: Math.round(12 * scaleFactor),
		fontFamily: 'TinyUnicode',
		color: '#18122B',
		marginBottom: Math.round(4 * scaleFactor),
	},
	textArea: {
		height: 100,
		borderColor: '#999',
		borderWidth: 1,
		borderRadius: 4,
		padding: 8,
		fontSize: Math.round(12 * scaleFactor),
		backgroundColor: '#fff',
		marginBottom: Math.round(8 * scaleFactor),
	},
	astroContainer: {
		position: 'relative',
		marginVertical: 4,
	},
	textBox: {
		width: BOX_WIDTH,
		height: BOX_HEIGHT,
		position: 'absolute',
	},
	astroText: {
		fontSize: Math.round(12 * scaleFactor),
		textAlign: 'center',
		lineHeight: 40,
		color: '#18122B',
		fontFamily: 'TinyUnicode',
	},
	astroSelecionadoText: {
		color: '#000',
	},
});
