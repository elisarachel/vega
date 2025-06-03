import PageHeader from '@/components/PageHeader';
import LoadingAnimation from '@/components/LoadingAnimation';
import { useLocalSearchParams } from 'expo-router';
import { DateTime } from 'luxon';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useFonts } from 'expo-font';
import { MoonPhase } from 'astronomy-engine';
import { Canvas, Image as SkiaImage, useImage, FilterMode, MipmapMode } from '@shopify/react-native-skia';
import data2025 from '@/assets/data/2025_pt.json';
import data2026 from '@/assets/data/2026_pt.json';
import data2027 from '@/assets/data/2027_pt.json';
import data2028 from '@/assets/data/2028_pt.json';
import data2029 from '@/assets/data/2029_pt.json';
import data2030 from '@/assets/data/2030_pt.json';
import data2031 from '@/assets/data/2031_pt.json';
import * as Location from 'expo-location';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;

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
	'Indisponível': require('@/assets/images/parcialmentenublado.png')
};

const weatherCodeToDescription = (code: number): "" | "Céu limpo" | "Parcialmente nublado" | "Nublado" | "Chuva" | "Neve" | "Tempestade" | "Indisponível" => {
	if ([0].includes(code)) return 'Céu limpo';
	if ([1, 2].includes(code)) return 'Parcialmente nublado';
	if ([3, 45, 48].includes(code)) return 'Nublado';
	if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Chuva';
	if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Neve';
	if ([95, 96, 99].includes(code)) return 'Tempestade';
	return 'Indisponível';
};

export default function DateModal() {
	const { date } = useLocalSearchParams();
	const eventDate = DateTime.fromISO(String(date)); // '2025-06-12' → DateTime
	const [eventData, setEventData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [moonPhase, setMoonPhase] = useState<keyof typeof moonPhaseImages | null>(null);
	const [weatherDescription, setWeatherDescription] = useState<keyof typeof weatherIcons | "">("");
	const [isWeatherLoading, setIsWeatherLoading] = useState(true); // Estado para o carregamento do clima
	const [userNote, setUserNote] = useState<any>(null); // Estado para armazenar as notas do usuário
	const user = getAuth().currentUser; // Obter usuário autenticado
	const db = getFirestore();

	const moonPhaseImages = {
		nova: require('@/assets/images/nova.png'),
		crescente: require('@/assets/images/crescente.png'),
		cheia: require('@/assets/images/cheia.png'),
		minguante: require('@/assets/images/minguante.png'),
	};

	const moonPhaseImage = useImage(
		moonPhase ? moonPhaseImages[moonPhase] : moonPhaseImages['nova']
	);

	const weatherIcon = useImage(weatherDescription ? weatherIcons[weatherDescription] : null);

	const loadedWeatherIcons = {
		'Céu limpo': useImage(weatherIcons['Céu limpo']),
		'Parcialmente nublado': useImage(weatherIcons['Parcialmente nublado']),
		'Nublado': useImage(weatherIcons['Nublado']),
		'Chuva': useImage(weatherIcons['Chuva']),
		'Neve': useImage(weatherIcons['Neve']),
		'Tempestade': useImage(weatherIcons['Tempestade']),
		'Indisponível': useImage(weatherIcons['Indisponível']),
	};
	
	useEffect(() => {
		let isMounted = true;
		const year = eventDate.year;
		const dataMap: { [key: number]: any } = {
			2025: data2025,
			2026: data2026,
			2027: data2027,
			2028: data2028,
			2029: data2029,
			2030: data2030,
			2031: data2031
		};
		const selectedData = dataMap[year];
		if (isMounted) {
			setEventData(selectedData || null); // Set null if no data is available
		}
		setIsLoading(false);

		return () => {
			isMounted = false;
		};
	}, [eventDate]);

	useEffect(() => {
		let isMounted = true; 
		const calculateMoonPhase = () => {
			const phase = MoonPhase(eventDate.toJSDate());
			if (!isMounted) return; 

			if (phase >= 0 && phase < 45 || phase >= 315 && phase < 360) {
				setMoonPhase('nova');
			} else if (phase >= 45 && phase < 135) {
				setMoonPhase('crescente');
			} else if (phase >= 135 && phase < 225) {
				setMoonPhase('cheia');
			} else if (phase >= 225 && phase < 315) {
				setMoonPhase('minguante');
			}
		};
		calculateMoonPhase();

		return () => {
			isMounted = false;
		};
	}, [eventDate]); 

	useEffect(() => {
		let isCancelled = false;
	
		const fetchWeather = async () => {
			try {
				const today = DateTime.now().startOf('day');
				const selectedDate = eventDate.startOf('day');
				const daysDifference = selectedDate.diff(today, 'days').days;

				// Skip fetching if the date is more than 16 days in the future
				if (daysDifference > 16) {
					setWeatherDescription('Indisponível');
					return;
				}

				const location = await Location.getCurrentPositionAsync({});
				const lat = location.coords.latitude;
				const lon = location.coords.longitude;
		
				const dateStr = eventDate.toISODate();
				const isPastDate = selectedDate < today;
		
				const baseUrl = isPastDate
					? 'https://archive-api.open-meteo.com/v1/archive'
					: 'https://api.open-meteo.com/v1/forecast';
		
				const response = await fetch(
					`${baseUrl}?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=weathercode&timezone=auto`
				);
				const data = await response.json();
		
				if (data.daily && data.daily.weathercode && data.daily.weathercode.length > 0) {
					const code = data.daily.weathercode[0];
					setWeatherDescription(weatherCodeToDescription(code));
				} else {
					setWeatherDescription('Indisponível');
				}
			} catch (error) {
				console.error('Erro ao buscar clima:', error);
				setWeatherDescription('Indisponível');
			}
		};
		
		fetchWeather();
	
		return () => {
			isCancelled = true;
		};
	}, [eventDate]);
	

	useEffect(() => {
		const fetchUserNotes = async () => {
			if (user) {
				try {
					const notesQuery = query(
						collection(db, 'notas'),
						where('userId', '==', user.uid),
						where('data', '==', eventDate.toISODate()) 
					);
					const snapshot = await getDocs(notesQuery);
					if (!snapshot.empty) {
						const notes = snapshot.docs.map(doc => doc.data());
						setUserNote(notes); // Store all notes in the state
					}
				} catch (error) {
					console.error('Erro ao buscar notas do usuário:', error);
				}
			}
		};
		fetchUserNotes();
	}, [user, eventDate]); // Reexecutar ao mudar o usuário ou a data

	if (isLoading || (moonPhase && !moonPhaseImage)) {
		return (
			<View style={styles.container}>
				<LoadingAnimation />
			</View>
		);
	}

	interface VEvent {
		DTSTART: string;
		[key: string]: any;
	}

	interface VCalendar {
		VEVENT: VEvent[];
		[key: string]: any;
	}

	interface EventData {
		VCALENDAR: VCalendar[];
		[key: string]: any;
	}

	const events = eventData
		? (eventData as EventData).VCALENDAR[0].VEVENT.filter((event: VEvent) => {
			return DateTime.fromISO(event.DTSTART).toISODate() === eventDate.toISODate();
		})
		: [];

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<View style={styles.container}>
				<PageHeader
					background={require('@/assets/images/header2.png')}
					icon={require('@/assets/images/calendar_icon2.png')}
					text={typeof date === 'string' ? DateTime.fromISO(date).toFormat('dd/MM/yyyy') : ''}
				/>
				<View style={styles.sectionTitleContainer}>
					<Text style={styles.sectionTitle}>FASE DA LUA</Text>
				</View>
				{moonPhase && moonPhaseImage && (
					<View style={styles.moonPhaseContainer}>
						<Canvas style={styles.moonPhaseCanvas}>
							<SkiaImage
								image={moonPhaseImage}
								x={0}
								y={0}
								width={styles.moonPhaseCanvas.width}
								height={styles.moonPhaseCanvas.height}
								fit="contain"
								sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
							/>
						</Canvas>
						<Text style={styles.moonPhaseName}>{moonPhase}</Text>
					</View>
				)}
				<View style={styles.sectionTitleContainer}>
					<Text style={styles.sectionTitle}>EVENTOS</Text>
				</View>
				<View style={styles.eventsContainer}>
					{events.length > 0 ? (
						events.map((event, index) => (
							<View key={index}>
								<Text style={styles.eventTitle}>
									{event.SUMMARY}
								</Text>
								<Text style={styles.eventText}>
									{event.DESCRIPTION}
								</Text>
							</View>
						))
					) : (
						<Text style={styles.noEventsText}>Sem eventos</Text>
					)}
				</View>
				<View style={styles.sectionTitleContainer}>
					<Text style={styles.sectionTitle}>CONDIÇÕES DE OBSERVAÇÃO</Text>
				</View>
				<View style={styles.weatherContainer}>
					{(!weatherDescription || !loadedWeatherIcons[weatherDescription]) ? (
						<LoadingAnimation />
					) : (
						<>
							<Canvas style={styles.weatherIcon}>
								<SkiaImage
									image={loadedWeatherIcons[weatherDescription]}
									x={0}
									y={0}
									width={styles.weatherIcon.width}
									height={styles.weatherIcon.height}
									fit="contain"
									sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
								/>
							</Canvas>
							<Text style={styles.weatherDescription}>{weatherDescription}</Text>
						</>
					)}
				</View>
				{userNote && userNote.length > 0 && (
					<>
						<View style={styles.sectionTitleContainer}>
							<Text style={styles.sectionTitle}>SUAS NOTAS</Text>
						</View>
						{userNote.map((note: any, idx: number) => (
							<View key={idx} style={styles.userNoteContainer}>
								<Text style={styles.label}>Fase da Lua:</Text>
								<Text style={styles.content}>{note.faseDaLua}</Text>

								<Text style={styles.label}>Condições de Observação:</Text>
								<Text style={styles.content}>{note.condicaoObservacao}</Text>

								<Text style={styles.label}>Astros selecionados:</Text>
								{(Array.isArray(note.astrosSelecionados) ? note.astrosSelecionados.map((astro: string, idx: number) => (
									<Text key={idx} style={styles.content}>• {astroNamesPT[astro] || astro}</Text>
								)) : null)}

								<Text style={styles.label}>Texto:</Text>
								<Text style={styles.content}>{note.texto}</Text>

								<Text style={styles.label}>Cidade:</Text>
								<Text style={styles.content}>{note.location}</Text>

								{userNote.length > 1 && idx < userNote.length - 1 && (
									<Text style={styles.separator}>D</Text>
								)}
							</View>
						))}
					</>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#E9ECF5',
	},
	scrollContainer: {
		flexGrow: 1,
	},
	eventsContainer: {
		padding: Math.round(6*scaleFactor),
		gap: Math.round(4*scaleFactor)
	},
	eventText: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(12*scaleFactor),
		color: '#7A7D8D',
	},
	eventTitle: {
		fontFamily: 'Tiny5',
		fontSize: Math.round(7*scaleFactor),
		color: '#18122B',
		textTransform: 'uppercase'
	},
	moonPhaseContainer: {
		padding: Math.round(6*scaleFactor),
		alignItems: 'center'
	},
	moonPhaseText: {
		fontFamily: 'Tiny5',
		fontSize: Math.round(7 * scaleFactor),
		color: '#18122B',
		textTransform: 'uppercase'
	},
	moonPhaseCanvas: {
		width: Math.round(16 * scaleFactor),
		height: Math.round(16 * scaleFactor),
	},
	moonPhaseName: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(12 * scaleFactor),
		color: '#7A7D8D',
		textTransform: 'capitalize',
	},
	sectionTitle: {
		fontFamily: 'Tiny5',
		color: '#18122B',
		fontSize: Math.round(8 * scaleFactor),
		textTransform: 'uppercase',
		textAlign: 'center'
	},
	sectionTitleContainer: {
		paddingTop: Math.round(6*scaleFactor),
	},
	noEventsText: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(12 * scaleFactor),
		color: '#7A7D8D',
		textAlign: 'center'
	},
	weatherContainer: {
		padding: Math.round(6 * scaleFactor),
		alignItems: 'center',
	},
	weatherIcon: {
		width: Math.round(16 * scaleFactor),
		height: Math.round(16 * scaleFactor),
	},
	weatherDescription: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(12 * scaleFactor),
		color: '#7A7D8D',
		textTransform: 'capitalize',
	},
	userNoteContainer: {
		padding: Math.round(6 * scaleFactor),
		marginHorizontal: Math.round(6 * scaleFactor),
		marginBottom: Math.round(8 * scaleFactor),
	},
	label: {
		fontSize: Math.round(12 * scaleFactor),
		color: '#18122B',
		fontFamily: 'TinyUnicode',
		marginTop: Math.round(4 * scaleFactor),
	},
	content: {
		fontSize: Math.round(12 * scaleFactor),
		color: '#7A7D8D',
		fontFamily: 'TinyUnicode',
	},
	separator: {
		marginTop: Math.round(4 * scaleFactor),
		textAlign: 'center',
		fontFamily: 'Emoji',
		fontSize: Math.round(12 * scaleFactor),
		color: '#18122B',
		marginBottom: -Math.round(20 * scaleFactor),
	},
});
