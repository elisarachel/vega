import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';

export default function NoteEditor({ astrosVisiveis, onSave }) {
	const [selectedAstros, setSelectedAstros] = useState<string[]>([]);
	const [text, setText] = useState('');

	const handleToggle = (astro: string) => {
		setSelectedAstros((prev) =>
			prev.includes(astro) ? prev.filter((a) => a !== astro) : [...prev, astro]
		);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.label}>Astros visíveis agora:</Text>
			{astrosVisiveis.map((astro) => (
				<Button
					key={astro}
					title={selectedAstros.includes(astro) ? `★ ${astro}` : astro}
					onPress={() => handleToggle(astro)}
				/>
			))}

			<TextInput
				style={styles.input}
				multiline
				placeholder="Escreva sua observação..."
				value={text}
				onChangeText={setText}
			/>

			<Button
				title="Salvar Nota"
				onPress={() =>
					onSave({
						timestamp: new Date().toISOString(),
						content: text,
						astroList: selectedAstros
					})
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { padding: 16 },
	label: { fontSize: 16, marginBottom: 8 },
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 12,
		marginVertical: 12,
		height: 120,
		textAlignVertical: 'top'
	}
});
