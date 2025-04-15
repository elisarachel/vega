import React from 'react';
import { View, Text, StyleSheet, ImageSourcePropType, Dimensions, TouchableOpacity } from 'react-native';
import { Canvas, Image as SkiaImage, useImage } from '@shopify/react-native-skia';

type IconButtonProps = {
  image: ImageSourcePropType;
  text: string;
  onPress?: () => void;
  icon?: ImageSourcePropType;
};

const ORIGINAL_DESIGN_WIDTH = 144;
const ORIGINAL_BUTTON_HEIGHT = 20;
const ORIGINAL_FONT_SIZE = 14;
const ORIGINAL_BUTTON_WIDTH = 97;
const ORIGINAL_ICON_SIZE = 16;

const { width: screenWidth } = Dimensions.get('window');

export default function IconButton({ image, text, onPress, icon }: IconButtonProps) {
  const scaleFactor = screenWidth / ORIGINAL_DESIGN_WIDTH;
  
  // Tamanhos dinâmicos
  const buttonHeight = Math.round(ORIGINAL_BUTTON_HEIGHT * scaleFactor);
  const fontSize = Math.round(ORIGINAL_FONT_SIZE * scaleFactor);
  const padding = Math.round(8 * scaleFactor);
  const buttonWidth = Math.round(ORIGINAL_BUTTON_WIDTH * scaleFactor);
  const iconSize = Math.round(ORIGINAL_ICON_SIZE * scaleFactor);

  const backgroundImage = useImage(image as any);

  return (
    <TouchableOpacity 
      style={[styles.container, { height: buttonHeight, width: buttonWidth }]}
      onPress={onPress}
    >
      {/* Fundo do botão */}
      {backgroundImage && (
        <Canvas style={{ width: buttonWidth, height: buttonHeight }}>
          <SkiaImage
            image={backgroundImage}
            x={0}
            y={0}
            width={buttonWidth}
            height={buttonHeight}
            fit="contain"
          />
        </Canvas>
      )}

      {/* Texto e ícone sobre a imagem */}
      <View style={[styles.content, { position: 'absolute', width: buttonWidth, height: buttonHeight }]}>
        <Text style={[
          styles.text,
          { 
            fontSize: fontSize,
          }
        ]}>
          {text}
        </Text>
        {icon && (
          <Canvas style={{ width: iconSize, height: iconSize, marginLeft: 8 }}>
            <SkiaImage
              image={useImage(icon as any)}
              x={0}
              y={0}
              width={iconSize}
              height={iconSize}
              fit="contain"
            />
          </Canvas>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
	left: Math.round(14.5 * Dimensions.get('window').width / ORIGINAL_DESIGN_WIDTH),
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'TinyUnicode',
    color: '#18122B',
    includeFontPadding: false,
    textAlign: 'center',
	bottom: Math.round(1.5*Dimensions.get('window').width / ORIGINAL_DESIGN_WIDTH),
  },
});