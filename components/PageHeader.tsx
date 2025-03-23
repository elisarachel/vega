import React from 'react';
import { View, StyleSheet, Text, ImageSourcePropType, Dimensions } from 'react-native';
import { Canvas, FilterMode, MipmapMode, Image as SkiaImage, useImage } from '@shopify/react-native-skia';
import { router } from 'expo-router';

type PageHeaderProps = {
	background: ImageSourcePropType;
	icon: ImageSourcePropType;
	text: string;
};

const ORIGINAL_DESIGN_WIDTH = 144; // Largura do card no Figma
const ORIGINAL_ICON_SIZE = 16; // Tamanho original do ícone no Figma
const ORIGINAL_CLOSE_SIZE = 5;

const { width: screenWidth } = Dimensions.get('window');

export default function PageHeader({ background, icon, text }: PageHeaderProps) {
	const bgImage = typeof background === "number" ? useImage(background) : null;
	const iconImg = typeof icon === "number" ? useImage(icon) : null;
	const closeIcon = useImage(require('../assets/images/x.png'));
	
	if (!bgImage || !iconImg) return null;
	
	const scaleFactor = screenWidth / ORIGINAL_DESIGN_WIDTH;
	const iconSize = Math.round(ORIGINAL_ICON_SIZE * scaleFactor);
	const closeSize = Math.round(ORIGINAL_CLOSE_SIZE * scaleFactor);
	const pixelPerfectIconSize = iconSize + (iconSize % 2); // Mantém múltiplos de 2

	const bgAspectRatio = bgImage.height() / bgImage.width();
	const headerHeight = screenWidth * bgAspectRatio;
	
	return (
		<View style={[styles.container, { height: headerHeight }]}>
			<Canvas style={StyleSheet.absoluteFill}>
				<SkiaImage
					image={bgImage}
					x={0}
					y={0}
					width={screenWidth}
					height={headerHeight}
					fit="contain"
					sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.Nearest }}
					/>
			</Canvas>

			<View style={[styles.contentContainer, { height: headerHeight }]}>
			<Canvas style={{width: iconSize, height: iconSize} }>
				<SkiaImage
					image={iconImg}
					x={0}
					y={0}
					width={iconSize}
					height={iconSize}
					fit="contain"
					sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.Nearest }}
				/>
			</Canvas>
		
			<Text style={[styles.text, { fontSize: Math.round(16 * scaleFactor),
            							 marginLeft: Math.round(4 * scaleFactor)
          								}
        ]}>{text}</Text>
		</View>

			{/* Botão de fechar */}
			{closeIcon && (
				<Canvas style={[
					styles.closeButton,
					{ 
					  top: headerHeight / 1.5 - closeSize / 1,
					  left: Math.round(132 * scaleFactor),
					  width: closeSize,
					  height: closeSize
					}
				  ]} onTouchEnd={() => router.back()}>
					<SkiaImage image={closeIcon} x={0} y={0} width={closeSize} height={closeSize} fit="contain"
					sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.Nearest }} />
				</Canvas>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
	  width: '100%',
	  position: 'relative',
	},
	contentContainer: {
	  flexDirection: 'row',
	  alignItems: 'center',
	  paddingHorizontal: 16,
	},
	text: {
	  fontFamily: 'TinyUnicode',
	  color: '#18122B',
	  includeFontPadding: false,
	  textAlignVertical: 'center',
	  bottom: Math.round(1 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
	closeButton: {
	  position: 'absolute',
	},
  });