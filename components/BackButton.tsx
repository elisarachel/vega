import React from 'react';
import { Canvas, Image as SkiaImage, useImage, FilterMode, MipmapMode } from '@shopify/react-native-skia';
import { Dimensions } from 'react-native';
import { router } from 'expo-router';

const ORIGINAL_BACK_SIZE = 10;
const { width: screenWidth } = Dimensions.get('window');

export default function BackButton() {
	const backIcon = useImage(require('@/assets/images/back_arrow.png'));

	if (!backIcon) return null;

	const scaleFactor = screenWidth / 144;
	const backSize = Math.round(ORIGINAL_BACK_SIZE * scaleFactor);

	return (
		<Canvas
			style={{
				position: 'absolute',
				top: Math.round(8 * scaleFactor),
				left: Math.round(8 * scaleFactor),
				width: backSize,
				height: backSize,
			}}
			onTouchEnd={() => router.back()}
		>
			<SkiaImage
				image={backIcon}
				x={0}
				y={0}
				width={backSize}
				height={backSize}
				fit="contain"
				sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.Nearest }}
			/>
		</Canvas>
	);
}
