import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Canvas, Image as SkiaImage, useImage, FilterMode, MipmapMode } from '@shopify/react-native-skia';
import LoadingAnimation from './LoadingAnimation';

const ORIGINAL_DESIGN_WIDTH = 144;
const ORIGINAL_ICON_SIZE = 15;

type FilterHeaderProps = {
	title: string;
	filterIcon: string;
	onPress?: () => void;
};

const { width: screenWidth } = Dimensions.get('window');

export default function FilterHeader({ title, filterIcon, onPress }: FilterHeaderProps) {
	const iconImage = useImage(filterIcon);

	const scaleFactor = screenWidth / ORIGINAL_DESIGN_WIDTH;
	const iconSize = Math.round(ORIGINAL_ICON_SIZE * scaleFactor);

	const pixelPerfectIconSize = iconSize + (iconSize % 2);

	if (!iconImage) {
		return <LoadingAnimation />; 
	}

	return (
		<View style={styles.container}>
			<Text style={[styles.title, { fontSize: Math.round(10 * scaleFactor) }]}>
				{title}
			</Text>
			<TouchableOpacity onPress={onPress}>
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
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: Math.round(8 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		paddingVertical: Math.round(2 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
	title: {
		fontFamily: 'Tiny5',
		color: '#18122B',
		includeFontPadding: false,
	},
});