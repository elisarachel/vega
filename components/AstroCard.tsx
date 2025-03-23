import React from 'react';
import { View, Text, StyleSheet, ImageSourcePropType, Dimensions, TouchableOpacity } from 'react-native';
import { Canvas, Image as SkiaImage, useImage, Fill, scale } from '@shopify/react-native-skia';
import LoadingAnimation from './LoadingAnimation';
import { Link } from 'expo-router';
import removeAccents from 'remove-accents';
import { createSlug } from '@/services/database';

const ORIGINAL_DESIGN_WIDTH = 144; // Largura do card no Figma
const ORIGINAL_ICON_SIZE = 16; // Tamanho original do ícone no Figma

type AstroCardProps = {
	background: ImageSourcePropType;
	icon: ImageSourcePropType;
	name: string;
	time: string;
	isVisible: boolean;
};

const { width: screenWidth } = Dimensions.get('window');

const getSlug = (name: string) => {
	return createSlug(name);
};

export default function AstroCard({ background, icon, name, time, isVisible }: AstroCardProps) {
	const backgroundImage = typeof background === "number" ? useImage(background) : null;
	const iconImage = typeof icon === "number" ? useImage(icon) : null;

	if (!backgroundImage || !iconImage) {
		return (
			<LoadingAnimation />
		)
	}

	// Calcula a escala proporcional
	const scaleFactor = screenWidth / ORIGINAL_DESIGN_WIDTH;
	
	// Tamanho do ícone ajustado
	const iconSize = Math.round(ORIGINAL_ICON_SIZE * scaleFactor);
	
	// Mantém múltiplos de 2 para pixel perfect
	const pixelPerfectIconSize = iconSize + (iconSize % 2);

	const bgAspectRatio = backgroundImage.height() / backgroundImage.width();
	const cardHeight = screenWidth * bgAspectRatio;

	
	return (
		<View style={[styles.container, { width: screenWidth, height: cardHeight }]}>
			{/* Background */}
			<Canvas style={[styles.canvasBackground, { width: screenWidth, height: cardHeight }]}>
				<SkiaImage
					image={backgroundImage}
					x={0}
					y={0}
					width={screenWidth}
					height={cardHeight}
					fit="contain"
				/>
			</Canvas>
			<Link 
				href={{
					pathname: `/astro/[name]`,
					params: { name: getSlug(name), isVisible: isVisible ? 'true' : 'false' } // envia como string
				}} 
				asChild
			>
                <TouchableOpacity style={styles.touchableArea}>
                    <View style={styles.content}>
                        <View style={styles.leftSection}>
                            <Canvas style={{ 
                                width: pixelPerfectIconSize,
                                height: pixelPerfectIconSize 
                            }}>
                                <SkiaImage
                                    image={iconImage}
                                    x={0}
                                    y={0}
                                    width={pixelPerfectIconSize}
                                    height={pixelPerfectIconSize}
                                    fit="contain"
                                />
                            </Canvas>
                            <Text style={[
                                styles.name, 
                                { fontSize: Math.round(14 * scaleFactor) }
                            ]}>
                                {name}
                            </Text>
                        </View>
                        <Text style={[
                            styles.time, 
                            { fontSize: Math.round(14 * scaleFactor) }
                        ]}>
                            {time}
                        </Text>
                    </View>
                </TouchableOpacity>
            </Link>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		marginVertical: Math.round((screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
	canvasBackground: {
		...StyleSheet.absoluteFillObject,
	},
	touchableArea: {
		flex: 1,
	},
	content: {
		...StyleSheet.absoluteFillObject,
		flexDirection: 'row',
		justifyContent: 'space-between',
		//alignItems: 'center',
		paddingHorizontal: Math.round(8 * (screenWidth / ORIGINAL_DESIGN_WIDTH)), // Padding escalado
		//height: '100%',
		//textAlignVertical: 'center', // Centraliza o texto verticalmente
	},
	leftSection: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Math.round(4 * (screenWidth / ORIGINAL_DESIGN_WIDTH)), // Espaço entre elementos escalado
		height: '100%',
	},
	iconContainer: {
		// Tamanho definido dinamicamente
	},
	name: {
		fontFamily: 'TinyUnicode',
		color: '#18122B',
		includeFontPadding: false,
		textAlignVertical: 'center', // Centraliza o texto verticalmente
		//lineHeight: Math.round(16 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		paddingBottom: Math.round(3*(screenWidth / ORIGINAL_DESIGN_WIDTH))
	},
	time: {
		fontFamily: 'TinyUnicode',
		color: '#7A7D8D',
		includeFontPadding: false,
		textAlignVertical: 'center', // Centraliza o texto verticalmente
		//lineHeight: Math.round(14 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		paddingBottom: Math.round(2*(screenWidth / ORIGINAL_DESIGN_WIDTH))
	},
});