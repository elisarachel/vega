import PageHeader from '@/components/PageHeader';
import LoadingAnimation from '@/components/LoadingAnimation';
import { useLocalSearchParams } from 'expo-router';
import { DateTime } from 'luxon';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
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

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;

export default function DateModal() {
	const { date } = useLocalSearchParams();
	const eventDate = DateTime.fromISO(String(date)); // '2025-06-12' → DateTime
	const [eventData, setEventData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const [moonPhase, setMoonPhase] = useState<keyof typeof moonPhaseImages | null>(null);

	const moonPhaseImages = {
		nova: require('@/assets/images/nova.png'),
		crescente: require('@/assets/images/crescente.png'),
		cheia: require('@/assets/images/cheia.png'),
		minguante: require('@/assets/images/minguante.png'),
	};

	const moonPhaseImage = useImage(
		moonPhase ? moonPhaseImages[moonPhase] : moonPhaseImages['nova']
	);
	
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
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#E9ECF5',
	},
	eventsContainer: {
		padding: Math.round(6*scaleFactor),
	},
	eventText: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(12*scaleFactor),
		color: '#7A7D8D',
		marginBottom: Math.round(6*scaleFactor),
	},
	eventTitle: {
		fontFamily: 'Tiny5',
		fontSize: Math.round(7*scaleFactor),
		color: '#18122B',
		textTransform: 'uppercase'
	},
	moonPhaseContainer: {
		padding: Math.round(6*scaleFactor),
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
	},
	sectionTitleContainer: {
		paddingHorizontal: Math.round(6*scaleFactor),
	},
	noEventsText: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(12 * scaleFactor),
		color: '#7A7D8D',
	},
});
