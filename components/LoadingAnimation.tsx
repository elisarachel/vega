import React, { useState } from 'react';
import { Canvas, Image as SkiaImage, useAnimatedImageValue } from '@shopify/react-native-skia';
import { Dimensions, View, StyleSheet } from 'react-native';

const ORIGINAL_DESIGN_WIDTH = 144;
const ORIGINAL_ICON_SIZE = 16;

const { width: screenWidth } = Dimensions.get('window');

const PixelLoader = () => {
	const animatedImage = useAnimatedImageValue(require('../assets/animations/loading/loading.gif'));
	
	// Verifica se a imagem foi carregada
	if (!animatedImage) {
		return null;
	}
	
	// Calcula a escala proporcional
	const scaleFactor = screenWidth / ORIGINAL_DESIGN_WIDTH;
	
	// Tamanho do ícone ajustado
	const iconSize = Math.round(ORIGINAL_ICON_SIZE * scaleFactor);
	
	// Mantém múltiplos de 2 para pixel perfect
	const pixelPerfectIconSize = iconSize + (iconSize % 2);
	
	return (
		<View>
			<Canvas style={{ width: pixelPerfectIconSize, height: pixelPerfectIconSize, justifyContent: 'center', alignItems: 'center' }}>
				<SkiaImage
					image={animatedImage}
					x={0}
					y={0}
					width={iconSize}
					height={iconSize}
					fit="contain"
				/>
			</Canvas>
		</View>
	);
};

export default PixelLoader;
