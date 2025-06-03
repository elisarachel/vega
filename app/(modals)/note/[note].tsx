import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, ScrollView, StyleSheet, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { DateTime } from 'luxon';
import { MoonPhase } from 'astronomy-engine';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';
import useVisibleAstros from '@/hooks/useVisibleAstros';
import PageHeader from '@/components/PageHeader';
import { Canvas, Image as SkiaImage, useImage, Rect, Text as SkiaText, useFont, FilterMode, MipmapMode } from '@shopify/react-native-skia';
import { useDayInfo } from '@/hooks/useDayInfo';
import IconButton from '@/components/Button'; 
import { router } from 'expo-router';
import * as Location from 'expo-location'; 
import { useRouter, useLocalSearchParams } from 'expo-router';
import PixelLoader from '@/components/LoadingAnimation';

const astroNamesPT: { [key: string]: string } = {
    'Mercury': 'Mercúrio',
    'Venus': 'Vênus',
    'Mars': 'Marte',
    'Jupiter': 'Júpiter',
    'Saturn': 'Saturno',
    'Moon': 'Lua',
    'Sun': 'Sol'
};

const weatherIcons = {
	'Céu limpo': require('@/assets/images/ceulimpo.png'),
	'Parcialmente nublado': require('@/assets/images/parcialmentenublado.png'),
	'Nublado': require('@/assets/images/nublado.png'),
	'Chuva': require('@/assets/images/chuvoso.png'),
	'Neve': require('@/assets/images/neve.png'),
	'Tempestade': require('@/assets/images/tempestade.png'),
	'Desconhecido': require('@/assets/images/parcialmentenublado.png')
};

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;

const BOX_HEIGHT = Math.round(15 * scaleFactor); 
const BOX_WIDTH = Math.round(80 * scaleFactor);

// Função para gerar um UUID simples
const generateUUID = () => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

export default function NovaNota() {
	const now = DateTime.now();
	

	const router = useRouter();
	const routerParams = useLocalSearchParams();

	// Determine if editing or creating a new note
	const isEditing = typeof routerParams.note === 'string' && routerParams.note !== 'nova';

	const { visibleAstros, location } = isEditing ? { visibleAstros: null, location: null } : useVisibleAstros();
	const { isLoading, moonPhase, weatherDescription, weatherIcon: calculatedWeatherIcon } = isEditing
		? { weatherDescription: routerParams.condicaoObservacao as keyof typeof weatherIcons, weatherIcon: null }
		: useDayInfo();

	// Determine weather icon based on condicaoObservacao when editing
	const weatherIcon = isEditing
		? weatherIcons[routerParams.condicaoObservacao as keyof typeof weatherIcons] || weatherIcons['Desconhecido']
		: calculatedWeatherIcon;

	// State variables
	const [texto, setTexto] = useState('');
	const [selecionados, setSelecionados] = useState<string[]>([]);
	const [faseDaLua, setFaseDaLua] = useState<string>('');
	const [condicaoObservacao, setCondicaoObservacao] = useState<string>('');
	const [isLoadingData, setIsLoadingData] = useState(true);
	const [astrosVisiveis, setAstrosVisiveis] = useState<string[]>([]);

	useEffect(() => {
		const loadData = async () => {
			setIsLoadingData(true);
			if (isEditing) {
				setTexto((routerParams.texto as string) || '');
				
				 // Ensure astrosSelecionados is an array
				const savedSelecionados = Array.isArray(routerParams.astrosSelecionados)
					? routerParams.astrosSelecionados
					: routerParams.astrosSelecionados
					? [routerParams.astrosSelecionados]
					: [];
				setSelecionados(savedSelecionados.map((astro) => astroNamesPT[astro] || astro));

				setFaseDaLua((routerParams.faseDaLua as string) || '');
				setCondicaoObservacao((routerParams.condicaoObservacao as string) || '');

				 // Ensure astrosVisiveis is an array
				const savedAstros = Array.isArray(routerParams.astrosVisiveis)
					? routerParams.astrosVisiveis
					: routerParams.astrosVisiveis
						? routerParams.astrosVisiveis.split(',') // Split comma-separated values
						: [];
				setAstrosVisiveis(savedAstros.map((astro) => astroNamesPT[astro] || astro));
			} else {
				setAstrosVisiveis(
					Array.isArray(visibleAstros?.now)
						? visibleAstros.now.map((astro) => astroNamesPT[astro.name] || astro.name)
						: []
				);
				const phase = MoonPhase(new Date());
				if (phase >= 0 && phase < 45 || phase >= 315 && phase < 360) {
					setFaseDaLua('Lua Nova');
				} else if (phase >= 45 && phase < 135) {
					setFaseDaLua('Lua Crescente');
				} else if (phase >= 135 && phase < 225) {
					setFaseDaLua('Lua Cheia');
				} else if (phase >= 225 && phase < 315) {
					setFaseDaLua('Lua Minguante');
				}

				if (weatherDescription) {
					setCondicaoObservacao(weatherDescription);
				}
			}
			setIsLoadingData(false);
		};

		loadData();
	}, [isEditing, weatherDescription, visibleAstros]);	

	const moonPhaseImages = {
		'Lua Nova': require('@/assets/images/nova.png'),
		'Lua Crescente': require('@/assets/images/crescente.png'),
		'Lua Cheia': require('@/assets/images/cheia.png'),
		'Lua Minguante': require('@/assets/images/minguante.png'),
	};

	const toggleAstro = (astro: string) => {
		setSelecionados(prev =>
			prev.includes(astro) ? prev.filter(a => a !== astro) : [...prev, astro]
		);
	};

	const salvarNota = async () => {
		try {
			const user = getAuth().currentUser;
			if (!user) {
				Alert.alert('Erro', 'Usuário não autenticado.');
				return;
			}

			let cityName = 'Local desconhecido';
			if (location) {
				const addresses = await Location.reverseGeocodeAsync({
					latitude: location.latitude,
					longitude: location.longitude,
				});
				if (addresses.length > 0) {
					const address = addresses[0];
					cityName = address.city || address.subregion || address.region || 'Local desconhecido';
				}
			}

			// Save astrosVisiveis in English for consistency in the database
			const astrosVisiveisInEnglish = selecionados.map((astro) =>
				Object.keys(astroNamesPT).find((key) => astroNamesPT[key] === astro) || astro
			);

			const nota = {
				userId: user.uid,
				data: now.toISODate(), // Salva a data no formato ISO 8601
				texto,
				faseDaLua,
				condicaoObservacao,
				astrosSelecionados: astrosVisiveisInEnglish,
				astrosVisiveis: astrosVisiveisInEnglish,
				location: cityName,
				criadoEm: now.toISO(),
			};

			if (isEditing) {
				// Update existing note logic here
				await setDoc(doc(db, 'notas', routerParams.note as string), nota);
				Alert.alert('Sucesso', 'Nota atualizada com sucesso!');
			} else {
				// Create new note logic here
				const notaId = generateUUID();
				await setDoc(doc(db, 'notas', notaId), nota);
				Alert.alert('Sucesso', 'Nota salva com sucesso!');
			}

			setTexto('');
			setSelecionados([]);
			router.push('/notes');
		} catch (err) {
			console.error(err);
			Alert.alert('Erro', 'Não foi possível salvar a nota.');
		}
	};

	const textBoxImage = useImage(require('@/assets/images/note_text_box.png'));
	const astroSelectImage = useImage(require('@/assets/images/astro_select.png'));
	const moonPhaseImage = useImage(moonPhaseImages[faseDaLua as keyof typeof moonPhaseImages]);
	const weatherIconImage = useImage(weatherIcon);
	const font = useFont(require('@/assets/fonts/TinyUnicode.ttf'), 12 * scaleFactor);

	return (
		<ScrollView contentContainerStyle={styles.container}>
			{isLoadingData ? (
				<View style={styles.loadingContainer}>
					<Text style={styles.loadingText}>Carregando dados...</Text>
				</View>
			) : (
				<>
					<PageHeader
						background={require('@/assets/images/header2_pink.png')}
						icon={require('@/assets/images/notes_icon.png')}
						text={isEditing ? "Editar Nota" : "Nova Nota"}
					/>
					<Text style={styles.currentDate}>
						{DateTime.now().toFormat('dd/MM/yyyy')}
					</Text>
					<Text style={styles.label}>Fase da Lua:</Text>
					<View style={styles.centeredContent}>
						{isLoading ? (
							<PixelLoader />
						) : (
							<>
								<Text style={styles.labelDescription}>{faseDaLua}</Text>
								<Canvas style={styles.iconCanvas}>
									{moonPhaseImage && (
										<SkiaImage
											image={moonPhaseImage}
											rect={{
												x: 0,
												y: 0,
												width: Math.round(16 * scaleFactor),
												height: Math.round(16 * scaleFactor),
											}}
											sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
										/>
									)}
								</Canvas>
							</>
						)}
					</View>

					<Text style={styles.label}>Condições de observação:</Text>
					<View style={styles.centeredContent}>
						{isLoading ? (
							<PixelLoader />
						) : (
							<>
								<Text style={styles.labelDescription}>{condicaoObservacao}</Text>
								<Canvas style={styles.iconCanvas}>
									{weatherIconImage && (
										<SkiaImage
											image={weatherIconImage}
											rect={{
												x: 0,
												y: 0,
												width: Math.round(16 * scaleFactor),
												height: Math.round(16 * scaleFactor),
											}}
											sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
										/>
									)}
								</Canvas>
							</>
						)}
					</View>

					<Text style={styles.label}>Astros visíveis:</Text>
					<View style={styles.centeredAstroGrid}>
						{isLoading ? (
							<PixelLoader />
						) : (
							astrosVisiveis.map((astro, idx) => {
								const isSelected = selecionados.includes(astro);

								return (
									<TouchableOpacity
										key={idx}
										style={styles.astroContainer}
										activeOpacity={0.8}
										onPress={() => toggleAstro(astro)}
									>
										<Canvas style={styles.astroSelect}>
											{/* Fundo do botão */}
											{astroSelectImage && (
												<SkiaImage
													image={astroSelectImage}
													x={0}
													y={0}
													width={BOX_WIDTH}
													height={BOX_HEIGHT}
													sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
												/>
											)}

											{/* Nome do astro dentro do canvas */}
											{font && (
												<SkiaText
													text={astro} // Display name in Portuguese
													x={Math.round(16 * scaleFactor)}
													y={BOX_HEIGHT / 2 + 2 * scaleFactor}
													color="#18122B"
													font={font}
												/>
											)}

											{/* Véu branco por cima se não selecionado */}
											{!isSelected && (
												<Rect
													x={0}
													y={0}
													width={BOX_WIDTH}
													height={BOX_HEIGHT}
													color="#E9ECF5"
													opacity={0.5}
												/>
											)}
										</Canvas>
									</TouchableOpacity>
								);
							})
						)}
					</View>

					<Text style={styles.label}>Escreva sua nota:</Text>
					<View style={styles.textInputContainer}>
						<Canvas style={styles.textBox}>
							{textBoxImage && (
								<SkiaImage
									image={textBoxImage}
									x={0}
									y={0}
									width={Math.round(128 * scaleFactor)}
									height={Math.round(149 * scaleFactor)}
									sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
								/>
							)}
						</Canvas>
						<TextInput
							multiline
							value={texto}
							onChangeText={setTexto}
							style={styles.textAreaOverlay}
							placeholder="Hoje eu vi..."
							placeholderTextColor="#7A7D8D"
							selectionColor="#18122b"
							editable
						/>
					</View>

					<View style={styles.saveButton}>
						<IconButton
							image={require('@/assets/images/pink_button.png')}
							icon={require('@/assets/images/save_icon.png')}
							text={isEditing ? "Atualizar Nota" : "Salvar Nota"}
							onPress={salvarNota}
						/>
					</View>
				</>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#E9ECF5',
	},
	currentDate: {
		fontSize: Math.round(16 * scaleFactor),
		color: '#18122B',
		fontFamily: 'TinyUnicode',
		marginTop: Math.round(4 * scaleFactor),
		textAlign: 'center',
	},
	label: {
		paddingHorizontal: Math.round(8 * scaleFactor),
		fontSize: Math.round(12 * scaleFactor),
		fontFamily: 'TinyUnicode',
		color: '#18122B',
		marginBottom: Math.round(4 * scaleFactor),
		marginTop: Math.round(4 * scaleFactor),
	},
	labelDescription: {
		paddingHorizontal: Math.round(4 * scaleFactor),
		fontSize: Math.round(12 * scaleFactor),
		fontFamily: 'TinyUnicode',
		color: '#7A7D8D',
		marginBottom: Math.round(4 * scaleFactor),
	},
	centeredContent: {
		alignItems: 'center',
		marginBottom: Math.round(8 * scaleFactor),
	},
	iconCanvas: {
		width: Math.round(16 * scaleFactor),
		height: Math.round(16 * scaleFactor),
	},
	centeredAstroGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		paddingHorizontal: Math.round(16 * scaleFactor),
		marginBottom: Math.round(8 * scaleFactor),
	},
	astroContainer: {
		marginVertical: Math.round(8 * scaleFactor),
		alignItems: 'center',
		width: BOX_WIDTH + Math.round(8 * scaleFactor),
	},
	astroSelect: {
		width: BOX_WIDTH,
		height: BOX_HEIGHT,
		position: 'absolute',
	},
	astroText: {
		fontSize: Math.round(12 * scaleFactor),
		textAlign: 'center',
		lineHeight: 40,
		color: '#18122B',
		fontFamily: 'TinyUnicode',
	},
	astroSelecionadoText: {
		color: '#18122B',
	},
	textInputContainer: {
		position: 'relative',
		height: Math.round(149 * scaleFactor),
		marginBottom: Math.round(8 * scaleFactor),
		alignItems: 'center',
		justifyContent: 'center',
	},
	textAreaOverlay: {
		position: 'absolute',
		width: '80%',
		height: '100%',
		padding: Math.round(2 * scaleFactor),
		fontSize: Math.round(12 * scaleFactor),
		color: '#18122B',
		fontFamily: 'TinyUnicode',
		textAlignVertical: 'top',
	},
	textBox: {
		width: Math.round(128 * scaleFactor),
		height: Math.round(149 * scaleFactor),
		position: 'absolute',
	},
	saveButton: {
        left: Math.round(10 * scaleFactor),
		marginBottom: Math.round(10 * scaleFactor),
    },
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#E9ECF5',
	},
	loadingText: {
		fontSize: Math.round(14 * scaleFactor),
		fontFamily: 'TinyUnicode',
		color: '#18122B',
	},
});
