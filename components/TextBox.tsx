import React from 'react';
import { View, TextInput, TextInputProps, StyleSheet, Dimensions } from 'react-native';
import { Canvas, useImage, Image as SkiaImage, FilterMode, MipmapMode } from '@shopify/react-native-skia';

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;
const BOX_WIDTH = Math.round(128 * scaleFactor); 
const BOX_HEIGHT = Math.round(20 * scaleFactor); 
const EDIT_BOX_WIDTH = Math.round(97 * scaleFactor);

type TextBoxProps = TextInputProps & {
	placeholder?: string;
	type?: 'edit';
};

export default function TextBox({ placeholder, type, ...props }: TextBoxProps) {
	const bgImage = useImage(
		type === 'edit'
			? require('@/assets/images/text_box_edit.png')
			: require('@/assets/images/text_box.png')
	);

	if (!bgImage) return null;

	const inputStyle = [
		styles.input,
		type === 'edit' && { paddingLeft: Math.round(4 * scaleFactor) }, 
	];

	return (
			<View
				style={[
					styles.container,
					{
						width: type === 'edit' ? EDIT_BOX_WIDTH : BOX_WIDTH,
						height: BOX_HEIGHT,
					},
				]}
			>
				<Canvas style={StyleSheet.absoluteFill}>
					<SkiaImage
						image={bgImage}
						x={0}
						y={0}
						width={type === 'edit' ? EDIT_BOX_WIDTH : BOX_WIDTH}
						height={BOX_HEIGHT}
						sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
					/>
				</Canvas>
				<TextInput
					placeholder={placeholder}
					placeholderTextColor="#7A7D8D"
					style={inputStyle}
					{...props}
				/>
			</View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: Math.round(4 * scaleFactor),
	},
	input: {
		position: 'absolute',
		width: '85%',
		fontSize: Math.round(12 * scaleFactor),
		fontFamily: 'TinyUnicode',
		color: '#18122B',
		paddingVertical: 0,
		textAlignVertical: 'center',
		paddingBottom: Math.round(2*scaleFactor),
	},
});
