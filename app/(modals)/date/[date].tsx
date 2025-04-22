import PageHeader from '@/components/PageHeader';
import LoadingAnimation from '@/components/LoadingAnimation';
import { useLocalSearchParams } from 'expo-router';
import { DateTime } from 'luxon';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useFonts } from 'expo-font';
import { MoonPhase } from 'astronomy-engine';
import { Canvas, Image as SkiaImage, useImage } from '@shopify/react-native-skia';
import data2025 from '@/assets/data/2025_pt.json';
import data2026 from '@/assets/data/2026_pt.json';
import data2027 from '@/assets/data/2027_pt.json';
import data2028 from '@/assets/data/2028_pt.json';
import data2029 from '@/assets/data/2029_pt.json';
import data2030 from '@/assets/data/2030_pt.json';
import data2031 from '@/assets/data/2031_pt.json';
import * as Location from 'expo-location';

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;

const weatherIcons = {
	'Céu limpo': require('@/assets/images/ceulimpo.png'),
	'Parcialmente nublado': require('@/assets/images/parcialmentenublado.png'),
	'Nublado': require('@/assets/images/nublado.png'),
	'Chuva': require('@/assets/images/chuvoso.png'),
	'Neve': require('@/assets/images/neve.png'),
	'Tempestade': require('@/assets/images/tempestade.png'),
	'Desconhecido': require('@/assets/images/parcialmentenublado.png')
};

const weatherCodeToDescription = (code: number): "" | "Céu limpo" | "Parcialmente nublado" | "Nublado" | "Chuva" | "Neve" | "Tempestade" | "Desconhecido" => {
	if ([0].includes(code)) return 'Céu limpo';
	if ([1, 2].includes(code)) return 'Parcialmente nublado';
	if ([3, 45, 48].includes(code)) return 'Nublado';
	if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Chuva';
	if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Neve';
	if ([95, 96, 99].includes(code)) return 'Tempestade';
	return 'Desconhecido';
};

export default function DateModal() {
	const { date } = useLocalSearchParams();
	const eventDate = DateTime.fromISO(String(date)); // '2025-06-12' → DateTime
	const [eventData, setEventData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [moonPhase, setMoonPhase] = useState<keyof typeof moonPhaseImages | null>(null);
	const [weatherDescription, setWeatherDescription] = useState<keyof typeof weatherIcons | "">("");

	const fetchWeather = async () => {
		try {
			const location = await Location.getCurrentPositionAsync({});
			const lat = location.coords.latitude;
			const lon = location.coords.longitude;
	
			const dateStr = eventDate.toISODate(); // ex: "2025-06-12"
	
			const response = await fetch(
				`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`
			);
			const data = await response.json();
	
			if (data.daily && data.daily.weathercode && data.daily.weathercode.length > 0) {
				const code = data.daily.weathercode[0];
				setWeatherDescription(weatherCodeToDescription(code));
				
			}
		} catch (error) {
			console.error('Erro ao buscar clima:', error);
		}
	};

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
	
	useEffect(() => {
		let isMounted = true; // Track if the component is mounted
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
		if (selectedData && isMounted) {
			setEventData(selectedData);
		} else if (isMounted) {
			console.error('No data available for the selected year:', year);
		}
		setIsLoading(false);

		return () => {
			isMounted = false; // Cleanup on unmount
		};
	}, [eventDate]);

	useEffect(() => {
		let isMounted = true; // Track if the component is mounted
		const calculateMoonPhase = () => {
			const phase = MoonPhase(new Date());
			if (!isMounted) return; // Prevent state updates if unmounted
			if (phase < 0.25) {
				setMoonPhase('nova');
			} else if (phase < 0.5) {
				setMoonPhase('crescente');
			} else if (phase < 0.75) {
				setMoonPhase('cheia');
			} else {
				setMoonPhase('minguante');
			}
		};
		calculateMoonPhase();

		return () => {
			isMounted = false; // Cleanup on unmount
		};
	}, []);

	useEffect(() => {
		fetchWeather();
	}, [eventDate]);	

	if (isLoading || (moonPhase && !moonPhaseImage)) {
		return (
			<View style={styles.container}>
				<LoadingAnimation />
			</View>
		);
	}

	if (!eventData) {
		return (
			<View style={styles.container}>
				<Text>Sem dados.</Text>
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

	const events = (eventData as EventData).VCALENDAR[0].VEVENT.filter((event: VEvent) => {
		return DateTime.fromISO(event.DTSTART).toISODate() === eventDate.toISODate();
	});

	return (
		<ScrollView contentContainerStyle={styles.scrollContainer}>
			<View style={styles.container}>
				<PageHeader
					background={require('@/assets/images/header2.png')}
					icon={require('@/assets/images/calendar_icon2.png')}
					text={typeof date === 'string' ? date : ''}
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
				{weatherDescription && (
					<View style={styles.weatherContainer}>
						{weatherIcons[weatherDescription] && (
							<Canvas style={styles.weatherIcon}>
								<SkiaImage
									image={weatherIcon}
									x={0}
									y={0}
									width={styles.weatherIcon.width}
									height={styles.weatherIcon.height}
									fit="contain"
								/>
							</Canvas>
						)}
						<Text style={styles.weatherDescription}>{weatherDescription}</Text>
					</View>
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
		gap: Math.round(6*scaleFactor)
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
		marginBottom: Math.round(4 * scaleFactor),
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
		marginTop: Math.round(4 * scaleFactor),
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
		marginBottom: Math.round(4 * scaleFactor),
	},
	weatherDescription: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(12 * scaleFactor),
		color: '#7A7D8D',
		textTransform: 'capitalize',
	},
});
