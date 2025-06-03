import { Stack, useLocalSearchParams, Link, useRouter } from 'expo-router';
import { View, ScrollView, StyleSheet, Text, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAstros, Astro, getAstroBySlug } from '@/services/database';
import { toggleFavorite, isFavorite } from '@/services/favorites';
import { useEffect, useState } from 'react';
import { Canvas, scale, Image as SkiaImage, useImage, FilterMode, MipmapMode } from '@shopify/react-native-skia';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { auth } from '@/services/firebaseConfig';

const ORIGINAL_DESIGN_WIDTH = 144; // Largura do card no Figma
const ORIGINAL_ICON_SIZE = 16; // Tamanho original do ícone no Figma
const ORIGINAL_CLOSE_SIZE = 5;

export const unstable_settings = {
	href: null,
};

const { width: screenWidth } = Dimensions.get('window');

// Mapeamento de nomes para imagens (ajuste conforme seus arquivos)
export const astroIcons: { [key: string]: any } = {
	'Mercúrio': require('@/assets/images/mercury.png'),
	'Vênus': require('@/assets/images/venus.png'),
	'Marte': require('@/assets/images/mars.png'),
	'Júpiter': require('@/assets/images/jupiter.png'),
	'Saturno': require('@/assets/images/saturn.png'),
	'Lua': require('@/assets/images/moon.png'),
	'Sol': require('@/assets/images/sun.png'),
};

export default function AstroDetails() {
    const { name, isVisible } = useLocalSearchParams();
	//const decodedName = decodeURIComponent(name as string);
    const [astro, setAstro] = useState<Astro | null>(null);
    const router = useRouter();
    const closeIcon = useImage(require('@/assets/images/x.png'));
	const backgroundImage = useImage(require('@/assets/images/header2.png'));
	const isCurrentlyVisible = isVisible === 'true';
	const [isFav, setIsFav] = useState(false);
    const heartIconSelected = useImage(require('@/assets/images/favorite_icon_selected.png'));
    const heartIconUnselected = useImage(require('@/assets/images/favorite_icon_unselected.png'));
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	// Calcula a escala proporcional
	const scaleFactor = screenWidth / ORIGINAL_DESIGN_WIDTH;
	
	// Tamanho do ícone ajustado
	const iconSize = Math.round(ORIGINAL_ICON_SIZE * scaleFactor);
	const closeSize = Math.round(ORIGINAL_CLOSE_SIZE * scaleFactor);
	
	// Mantém múltiplos de 2 para pixel perfect
	const pixelPerfectIconSize = iconSize + (iconSize % 2);

	const bgAspectRatio = backgroundImage ? backgroundImage.height() / backgroundImage.width() : 1;
	const cardHeight = screenWidth * bgAspectRatio;

    useEffect(() => {
		const loadAstro = async () => {
		  	if (typeof name === 'string') {
				const astro = await getAstroBySlug(name);
					setAstro(astro || null);
			}
		};
		loadAstro();
	}, [name]);

	useEffect(() => {
        const checkFavorite = async () => {
            if (astro) {
                const fav = await isFavorite(astro.slug);
                setIsFav(fav);
            }
        };
        checkFavorite();
    }, [astro]);

	useEffect(() => {
        const checkAuthState = () => {
            const user = auth.currentUser;
            setIsLoggedIn(!!user);
        };
        checkAuthState();
    }, []);

	const handleToggleFavorite = async () => {
        if (astro) {
            await toggleFavorite(astro.slug);
            setIsFav((prev) => !prev);
        }
    };

    if (!astro) {
        return (
            <View style={styles.container}>
                <Text>Astro não encontrado</Text>
            </View>
        );
    }

    const facts = JSON.parse(astro.facts);

    return (
		<View style={styles.container}>
			{/* Cabeçalho com nome e ícone */}
			<PageHeader
				background={require('@/assets/images/header2.png')}
				icon={astroIcons[astro.name]}
				text={astro.name}
			/>

			<ScrollView contentContainerStyle={styles.content}>
			<TouchableOpacity
				onPress={handleToggleFavorite} 
				style={styles.heartContainer}
				disabled={!isLoggedIn}
			>
				{isLoggedIn && (
					<Canvas style={{ width: iconSize, height: iconSize }}>
						<SkiaImage
							image={isFav ? heartIconSelected : heartIconUnselected}
							x={0}
							y={0}
							width={iconSize}
							height={iconSize}
							sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
						/>
					</Canvas>
				)}
			</TouchableOpacity>
				<View style={styles.infoCard}>
					<Text style={styles.sectionTitle}>DADOS ASTRONÔMICOS</Text>

					<View style={styles.infoRow}>
						<Text style={styles.label}>TIPO:</Text>
						<Text style={styles.value}>{astro.type}</Text>
					</View>

					<View style={styles.infoRow}>
						<Text style={styles.label}>DISTÂNCIA DA TERRA:</Text>
						<Text style={styles.value}>{astro.distance}</Text>
					</View>

					<View style={styles.infoRow}>
						<Text style={styles.label}>TAMANHO:</Text>
						<Text style={styles.value}>{astro.size}</Text>
					</View>

					<View style={styles.infoRow}>
						<Text style={styles.label}>MAGNITUDE:</Text>
						<Text style={styles.value}>{astro.magnitude}</Text>
					</View>

					{astro.moons && (
						<View style={styles.infoRow}>
							<Text style={styles.label}>LUAS:</Text>
							<Text style={styles.value}>{astro.moons}</Text>
						</View>
					)}

					<View style={styles.infoRow}>
						<Text style={styles.label}>CURIOSIDADES:</Text>
						<View>
							{facts.map((fact: string, index: number) => (
								<Text key={index} style={styles.value}>
									{fact}
								</Text>
							))}
						</View>
					</View>
				</View>

				{/* Botão de Encontrar no Céu */}
				{isCurrentlyVisible && (
					<View style={{ marginTop: Math.round(4 * scaleFactor) }}>
						<Button 
							image={require("@/assets/images/pink_button.png")}
							text="ENCONTRAR NO CÉU"
							onPress={() => router.push(`/compass?slug=${name}`)}
						/>
					</View>
				)}

			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#E9ECF5',
	},
	content: {
		paddingHorizontal: Math.round(8 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		paddingBottom: Math.round(8 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
	infoCard: {
		backgroundColor: '#E9ECF5',
	},
	sectionTitle: {
		fontFamily: 'Tiny5',
		color: '#18122B',
		fontSize: Math.round(8 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		marginBottom: Math.round(4 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		textTransform: 'uppercase',
		marginTop: Math.round(4 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
	infoRow: {
		flexDirection: 'column',
		justifyContent: 'space-between',
		paddingBottom: Math.round(8 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
	label: {
		fontFamily: 'Tiny5',
		color: '#18122B',
		fontSize: Math.round(7 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
	value: {
		fontFamily: 'TinyUnicode',
		color: '#7A7D8D',
		fontSize: Math.round(12 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
	findButton: {
		backgroundColor: '#18122B',
		paddingVertical: Math.round(8 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		borderRadius: Math.round(8 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		marginTop: Math.round(8 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		alignItems: 'center',
	},
	findButtonText: {
		color: '#FFFFFF',
		fontSize: Math.round(14 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		fontFamily: 'TinyUnicode',
		textTransform: 'uppercase',
	},
	errorText: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(16 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
		color: '#333',
		textAlign: 'center',
		marginTop: Math.round(8 * (screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
	heartContainer: {
        position: 'absolute',
        top: Math.round(4 * (screenWidth / ORIGINAL_DESIGN_WIDTH)), // Adjusted to place below the header
        right: Math.round(4 * (screenWidth / ORIGINAL_DESIGN_WIDTH)), // Positioned to the right
        zIndex: 1, // Ensures it appears above other elements
    },
});
