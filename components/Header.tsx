import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Image as SkiaImage, useImage, Fill } from '@shopify/react-native-skia';
import LoadingAnimation from './LoadingAnimation';

const ORIGINAL_DESIGN_WIDTH = 144; // Largura do design original
const ORIGINAL_ICON_SIZE = 16; // Tamanho do ícone original

type HeaderProps = {
	background: string;
	city: string;
	pinIcon: string;
};

const { width: screenWidth } = Dimensions.get('window');

export default function Header({ background, city, pinIcon }: HeaderProps) {
	const backgroundImage = typeof background === "number" ? useImage(background) : null;
	const iconImage = typeof pinIcon === "number" ? useImage(pinIcon) : null;

	const scaleFactor = screenWidth / ORIGINAL_DESIGN_WIDTH;

	// Tamanho do ícone ajustado
	const iconSize = Math.round(ORIGINAL_ICON_SIZE * scaleFactor);
	
	// Mantém múltiplos de 2 para pixel perfect
	const pixelPerfectIconSize = iconSize + (iconSize % 2);

	if (!backgroundImage || !iconImage) {
		return <LoadingAnimation />;
	}

	const bgAspectRatio = backgroundImage.height() / backgroundImage.width();
	const headerHeight = screenWidth * bgAspectRatio;

	return (
		<View style={[styles.container, { height: headerHeight }]}>
			<Canvas style={[styles.canvas, { width: screenWidth, height: headerHeight }]}>
				<Fill color="#E9ECF5" />
				<SkiaImage 
					image={backgroundImage} 
					x={0} 
					y={0} 
					width={screenWidth} 
					height={headerHeight} fit="contain" 
				/>
			</Canvas>

			{/* Texto e Ícone */}
			<View style={styles.content}>
				<Text style={[styles.cityText, { fontSize: Math.round(14 * scaleFactor) }]}>{city}</Text>
				<Canvas style={{ width: pixelPerfectIconSize, height: pixelPerfectIconSize }}>
					<SkiaImage 
						image={iconImage} 
						x={0} 
						y={0} 
						width={iconSize} 
						height={iconSize} fit="contain" 
					/>
				</Canvas>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
		position: 'relative',
	},
	canvas: {
		...StyleSheet.absoluteFillObject,
	},
	content: {
		position: 'absolute',
		width: '100%',
		height: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		//paddingBottom: Math.round((screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
	cityText: {
		fontFamily: 'TinyUnicode',
		color: '#18122B',
		marginRight: Math.round(2 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		includeFontPadding: false,
		paddingBottom: Math.round(2 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
});
