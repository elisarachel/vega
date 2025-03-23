import React from 'react';
import {
	View,
	StyleSheet,
	Modal,
	Text,
	TouchableOpacity,
	Dimensions,
} from 'react-native';
import {
	Canvas,
	FilterMode,
	MipmapMode,
	Image as SkiaImage,
	useImage,
} from '@shopify/react-native-skia';
import { router } from 'expo-router';

type FilterPopupProps = {
	visible: boolean;
	onClose: () => void;
	onSelect: (type: string | null) => void;
};

const FILTER_OPTIONS = ['Tudo', 'Planeta', 'Estrela', 'Satélite'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ORIGINAL_WIDTH = 144;
const scaleFactor = SCREEN_WIDTH / ORIGINAL_WIDTH;
const POPUP_WIDTH = 104*scaleFactor;
const POPUP_HEIGHT = 122*scaleFactor;
const ORIGINAL_CLOSE_SIZE = 5;
const ORIGINAL_ICON_SIZE = 14;

const FILTER_ICONS = {
    Tudo: require('@/assets/images/all_icon.png'),
    Planeta: require('@/assets/images/saturn.png'),
    Estrela: require('@/assets/images/star.png'),
    Satélite: require('@/assets/images/moon.png'),
};

export default function FilterPopup({ visible, onClose, onSelect }: FilterPopupProps) {
	const bgImage = useImage(require('@/assets/images/popup.png'));
	const closeIcon = useImage(require('../assets/images/x.png'));
	const closeSize = Math.round(ORIGINAL_CLOSE_SIZE * scaleFactor);
	const iconSize = Math.round(ORIGINAL_ICON_SIZE * scaleFactor);

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={[styles.popupContainer, { width: POPUP_WIDTH, height: POPUP_HEIGHT }]}>
					{/* Skia background */}
					<Canvas style={StyleSheet.absoluteFill}>
						{bgImage && (
							<SkiaImage
								image={bgImage}
								x={0}
								y={0}
								width={POPUP_WIDTH}
								height={POPUP_HEIGHT}
								fit="contain"
							/>
						)}
					</Canvas>

					{/* Conteúdo por cima da imagem */}
					<Text style={[styles.title, { fontSize: Math.round(8 * scaleFactor) }]}>
						FILTRAR POR TIPO:
					</Text>

					{/* Botão de fechar */}
					{closeIcon && (
						<Canvas style={[
							styles.closeButton,
							{ 
								top: (22*scaleFactor) / 1.5 - closeSize / 1,
								left: Math.round(90 * scaleFactor),
								width: closeSize,
								height: closeSize
							}
							]} onTouchEnd={() => onClose()}>
							<SkiaImage image={closeIcon} x={0} y={0} width={closeSize} height={closeSize} fit="contain"
							sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.Nearest }} />
						</Canvas>
					)}

					{FILTER_OPTIONS.map((type, index) => (
						<TouchableOpacity
							key={index}
							style={styles.option}
							onPress={() => {
								onSelect(type === 'Tudo' ? null : type);
								onClose();
							}}
						>
							<View style={styles.optionContainer}>
								<Canvas style={{ width: iconSize, height: iconSize, marginRight: 8 }}>
									<SkiaImage
										image={useImage(FILTER_ICONS[type as keyof typeof FILTER_ICONS])}
										x={0}
										y={0}
										width={iconSize}
										height={iconSize}
										fit="contain"
									/>
								</Canvas>
								<Text style={[styles.optionText, { fontSize: Math.round(12 * scaleFactor) }]}>
									{type}
								</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	popupContainer: {
		position: 'relative',
		alignItems: 'center', // Centers the entire content horizontally
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		paddingBottom: 56,
	},
	title: {
		marginTop: 32,
		fontFamily: 'Tiny5',
		color: '#18122B',
		alignSelf: 'center',
	},
	option: {
		alignSelf: 'flex-start', 
		marginLeft: 38, 
	},
	optionContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	optionText: {
		fontFamily: 'TinyUnicode',
		color: '#7A7D8D',
	},
	closeButton: {
		position: 'absolute',
	},
});
