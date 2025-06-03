import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Image as SkiaImage, useImage, FilterMode, MipmapMode } from '@shopify/react-native-skia';

const ORIGINAL_DESIGN_WIDTH = 144; // Largura de referência do design
const ORIGINAL_ICON_SIZE = 11; // Tamanho original do ícone

type SectionHeaderProps = {
	icon: string;
	text: string;
};

const { width: screenWidth } = Dimensions.get('window');

export default function SectionHeader({ icon, text }: SectionHeaderProps) {
	const iconImage = useImage(icon);

	// Fator de escala proporcional
	const scaleFactor = screenWidth / ORIGINAL_DESIGN_WIDTH;
	const iconSize = Math.round(ORIGINAL_ICON_SIZE * scaleFactor);

	// Garante múltiplos de 2 para manter pixel perfect
	const pixelPerfectIconSize = iconSize + (iconSize % 2);

	if (!iconImage) {
		return null; // Evita renderização antes da imagem carregar
	}

	return (
		<View style={styles.container}>
			<Canvas style={{ width: pixelPerfectIconSize, height: pixelPerfectIconSize }}>
				<SkiaImage
					image={iconImage}
					x={0}
					y={0}
					width={pixelPerfectIconSize}
					height={pixelPerfectIconSize}
					fit="contain"
					sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
				/>
			</Canvas>
			<Text style={[styles.text, { fontSize: Math.round(16 * scaleFactor) }]}>
				{text}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: Math.round(8 * (screenWidth / ORIGINAL_DESIGN_WIDTH)), // Padding dinâmico
		gap: Math.round(4 * (screenWidth / ORIGINAL_DESIGN_WIDTH)), // Espaçamento entre os elementos
	},
	text: {
		fontFamily: 'TinyUnicode',
		color: '#18122B',
		includeFontPadding: false,
		paddingBottom: Math.round(2 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
});
