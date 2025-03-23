import React from 'react';
import { View, Text, StyleSheet, ImageSourcePropType, Dimensions, TouchableOpacity } from 'react-native';
import { Canvas, Image as SkiaImage, useImage } from '@shopify/react-native-skia';

type IconButtonProps = {
  image: ImageSourcePropType;
  text: string;
  onPress?: () => void;
};

const ORIGINAL_DESIGN_WIDTH = 144;
const ORIGINAL_BUTTON_HEIGHT = 20;
const ORIGINAL_FONT_SIZE = 14;
const ORIGINAL_BUTTON_WIDTH = 97;

const { width: screenWidth } = Dimensions.get('window');

export default function IconButton({ image, text, onPress }: IconButtonProps) {
  const scaleFactor = screenWidth / ORIGINAL_DESIGN_WIDTH;
  
  // Tamanhos dinâmicos
  const buttonHeight = Math.round(ORIGINAL_BUTTON_HEIGHT * scaleFactor);
  const fontSize = Math.round(ORIGINAL_FONT_SIZE * scaleFactor);
  const padding = Math.round(8 * scaleFactor);
  const buttonWidth = Math.round(ORIGINAL_BUTTON_WIDTH * scaleFactor);

  const backgroundImage = useImage(image as any);

  return (
    <TouchableOpacity 
      style={[styles.container, { height: buttonHeight }]}
      onPress={onPress}
    >
      {/* Fundo do botão */}
      {backgroundImage && (
        <Canvas style={{width: buttonWidth, height: buttonHeight}}>
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

      {/* Texto centralizado */}
      <Text style={[
        styles.text,
        { 
          fontSize: fontSize,
        }
      ]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'TinyUnicode',
    color: '#18122B',
    includeFontPadding: false,
    textAlign: 'center',
	position: 'absolute',
	bottom: Math.round(6*screenWidth/ORIGINAL_DESIGN_WIDTH),
  },
});