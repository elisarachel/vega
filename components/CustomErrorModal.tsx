import React from 'react';
import { Modal, View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { Canvas, Image as SkiaImage, useImage } from '@shopify/react-native-skia';

type CustomErrorModalProps = {
	visible: boolean;
	message: string;
	onClose: () => void;
};

const ORIGINAL_WIDTH = 144;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scaleFactor = SCREEN_WIDTH / ORIGINAL_WIDTH;

const MODAL_WIDTH = 128 * scaleFactor;
const MODAL_HEIGHT = 74 * scaleFactor;

export default function CustomErrorModal({ visible, message, onClose }: CustomErrorModalProps) {
	const bgImage = useImage(require('@/assets/images/error_modal.png')); 

	if (!visible || !bgImage) return null;

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={[styles.modal, { width: MODAL_WIDTH, height: MODAL_HEIGHT }]}>
					<Canvas style={StyleSheet.absoluteFill}>
						<SkiaImage
							image={bgImage}
							x={0}
							y={0}
							width={MODAL_WIDTH}
							height={MODAL_HEIGHT}
							fit="contain"
						/>
					</Canvas>

					{/* Texto de erro */}
					<Text style={[styles.message, { fontSize: Math.round(8 * scaleFactor) }]}>
						{message}
					</Text>

					{/* Botão de fechar */}
					<TouchableOpacity style={styles.button} onPress={onClose}>
						<Text style={[styles.buttonText, { fontSize: Math.round(10 * scaleFactor) }]}>
							Fechar
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.6)',
		justifyContent: 'center',
		alignItems: 'center'
	},
	modal: {
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center'
	},
	message: {
		fontFamily: 'TinyUnicode',
		color: '#18122B',
		textAlign: 'center',
		marginTop: 16,
		marginHorizontal: 8,
	},
	button: {
		marginTop: 12,
		backgroundColor: '#E7817D',
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 6,
	},
	buttonText: {
		color: '#fff',
		fontFamily: 'Tiny5'
	}
});
