import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Canvas, scale, Text as SkiaText, useFont, useImage, Image as SkiaImage } from '@shopify/react-native-skia';
import { DateTime } from 'luxon';
import { Dimensions, View, StyleSheet, Text, ScrollView, Modal, Pressable, TouchableOpacity } from 'react-native';
import eventData2025 from '@/assets/data/2025_pt.json';
import eventData2026 from '@/assets/data/2026_pt.json';
import eventData2027 from '@/assets/data/2027_pt.json';
import eventData2028 from '@/assets/data/2028_pt.json';
import eventData2029 from '@/assets/data/2029_pt.json';
import eventData2030 from '@/assets/data/2030_pt.json';
import eventData2031 from '@/assets/data/2031_pt.json';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;

// constants
const CELL_WIDTH = 19 * scaleFactor;
const CELL_HEIGHT = 15 * scaleFactor;
const H_SPACING = 1 * scaleFactor;
const V_SPACING = 1 * scaleFactor;
const LEFT_MARGIN = 1 * scaleFactor;
const TOP_MARGIN = 1 * scaleFactor;

const monthNamesPT = [
	'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
	'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const CalendarOverlay = ({ year, month }: { year: number; month: number }) => {
	const [notasDoMes, setNotasDoMes] = useState<Set<number>>(new Set());
	const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); // Track user login state
	const font = useFont(require('@/assets/fonts/TinyUnicode.ttf'), 16 * scaleFactor);
	const calendarBackground = useImage(require('@/assets/images/calendar.png'));
	const eventIcon = useImage(require('@/assets/images/!.png'));
	const starIcon = useImage(require('@/assets/images/mini_star.png'));

	// Ensure hooks are called consistently
	const isResourcesLoaded = font && eventIcon && calendarBackground && starIcon;

	useEffect(() => {
		const fetchNotas = async () => {
			const user = getAuth().currentUser;
			setIsUserLoggedIn(!!user); // Update login state
			if (!user) return;

			const db = getFirestore();
			const notasQuery = query(
				collection(db, 'notas'),
				where('userId', '==', user.uid)
			);
			const snapshot = await getDocs(notasQuery);

			const diasComNota = new Set<number>();
			snapshot.forEach(doc => {
				const dataStr = doc.data().data;
				const data = DateTime.fromISO(dataStr);
				if (data.year === year && data.month === month) {
					diasComNota.add(data.day);
				}
			});

			setNotasDoMes(diasComNota);
		};

		fetchNotas();
	}, [year, month]);

	if (!isResourcesLoaded) return null;

	// Seleciona os dados de eventos com base no ano
	const eventData = (() => {
		switch (year) {
			case 2025: return eventData2025;
			case 2026: return eventData2026;
			case 2027: return eventData2027;
			case 2028: return eventData2028;
			case 2029: return eventData2029;
			case 2030: return eventData2030;
			case 2031: return eventData2031;
			default: return null; // No event data for years outside this range
		}
	})();

	// Extraia eventos para o mês atual
	const events = eventData?.VCALENDAR[0].VEVENT.filter((event) => {
		const eventDate = DateTime.fromISO(event.DTSTART);
		return eventDate.year === year && eventDate.month === month;
	}).reduce((acc: { [key: number]: any[] }, event) => {
		const eventDate = DateTime.fromISO(event.DTSTART);
		const day = eventDate.day;
		if (!acc[day]) acc[day] = [];
		acc[day].push(event);
		return acc;
	}, {}) || {};

	const handleDayPress = (dateString: string) => {
		router.push({
			pathname: '/(modals)/date/[date]',
			params: { date: dateString }, // exemplo: '2025-06-12'
		});
	};

	const cells = [];

	// Cabeçalho dos dias da semana
	const headers = weekDays.map((day, index) => {
		const x = LEFT_MARGIN + index * (CELL_WIDTH + H_SPACING);
		const y = 0; // bem no topo da imagem

		return (
			<SkiaText
				key={`weekday-${index}`}
				text={day}
				x={x + (8 * scaleFactor)}
				y={9 * scaleFactor}
				font={font}
				color="#E9ECF5"
			/>
		);
	});

	const daysInMonth = DateTime.local(year, month).daysInMonth || 0;
	const startDay = DateTime.local(year, month, 1).weekday % 7; // Calculate the starting day of the week (0 = Sunday, 6 = Saturday)
	for (let day = 1; day <= daysInMonth; day++) {
		const col = (day - 1 + startDay) % 7;
		const row = Math.floor((day - 1 + startDay) / 7);

		const x = LEFT_MARGIN + col * (CELL_WIDTH + H_SPACING);
		const y = TOP_MARGIN + row * (CELL_HEIGHT + V_SPACING);

		cells.push({
			day,
			x,
			y,
			hasEvent: !!events[day],
			text: (
				<SkiaText
					key={`text-${day}`}
					text={`${day}`}
					x={x + (2 * scaleFactor)}
					y={y + (18 * scaleFactor)}
					font={font}
					color="#18122B"
				/>
			),
			icons: [
				events[day] && eventIcon && (
					<SkiaImage key={`event-${day}`} image={eventIcon} x={x + (10 * scaleFactor)} y={y + (14 * scaleFactor)} width={10 * scaleFactor} height={10 * scaleFactor} />
				),
				isUserLoggedIn && notasDoMes.has(day) && starIcon && (
					<SkiaImage key={`star-${day}`} image={starIcon} x={x + (2 * scaleFactor)} y={y + (20 * scaleFactor)} width={5 * scaleFactor} height={5 * scaleFactor} />
				)
			]
		});
	}

	return (
		<View>
			<Canvas style={{ width: 141 * scaleFactor, height: 108 * scaleFactor }}>
				<SkiaImage
					image={calendarBackground}
					x={0}
					y={0}
					width={141 * scaleFactor}
					height={108 * scaleFactor}
					fit="contain"
				/>
				{headers}
				{cells.map(({ text }) => text)}
				{cells.map(({ icons }) => icons)}
			</Canvas>
			{cells.map(({ day, x, y }) => (
				<TouchableOpacity
					key={`touch-${day}`}
					onPress={() => handleDayPress(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
					style={{
						position: 'absolute',
						left: x,
						top: y + CELL_HEIGHT,
						width: CELL_WIDTH,
						height: CELL_HEIGHT,
					}}
				/>
			))}
		</View>
	);
};


export default function Calendar() {
	const [currentYear, setCurrentYear] = useState(DateTime.now().year); // Estado para o ano atual
	const currentMonth = DateTime.now().month; // Obtém o mês atual (1 = Janeiro, 12 = Dezembro)
	const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); 
	const eventIcon = useImage(require('@/assets/images/!.png'));
	const starIcon = useImage(require('@/assets/images/mini_star.png'));

	useEffect(() => {
		const user = getAuth().currentUser;
		setIsUserLoggedIn(!!user);
	}, []);

	const handleYearChange = (direction: 'prev' | 'next') => {
		setCurrentYear((prevYear: number) => {
			return direction === 'prev' ? prevYear - 1 : prevYear + 1;
		});
	};

	return (
		<View style={styles.container}>
			<Header
				background={require('@/assets/images/header.png')}
				pinIcon={require('@/assets/images/calendar_icon2.png')}
				city="Calendário"
			/>

			
			<View style={styles.yearSelector}>
				<Text style={styles.yearButton} onPress={() => handleYearChange('prev')}>{'<'}</Text>
				<Text style={styles.yearTitle}>{currentYear}</Text>
				<Text style={styles.yearButton} onPress={() => handleYearChange('next')}>{'>'}</Text>
			</View>

			{/* Legend Section */}
			<Text style={styles.legendTitle}>LEGENDA</Text>
			<View style={styles.legendContainer}>
				<View style={styles.legendItem}>
						<Canvas style={{ width: 5 * scaleFactor, height: 10 * scaleFactor }}>
							<SkiaImage
								image={eventIcon}
								x={0}
								y={0}
								width={5 * scaleFactor}
								height={10 * scaleFactor}
							/>
						</Canvas>
					<Text style={styles.legendText}>Evento Astronômico</Text>
				</View>
				{isUserLoggedIn && starIcon && (
					<View style={styles.legendItem}>
							<Canvas style={{ width: 5 * scaleFactor, height: 5 * scaleFactor }}>
								<SkiaImage
									image={starIcon}
									x={0}
									y={0}
									width={5 * scaleFactor}
									height={5 * scaleFactor}
								/>
							</Canvas>
						<Text style={styles.legendText}>Dia com Nota</Text>
					</View>
				)}
			</View>


			<ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: Math.round(36 * scaleFactor) }]}>
				{monthNamesPT.map((monthName, index) => (
					<View key={index} style={styles.monthBlock}>
						<Text style={styles.monthTitle}>{monthName}</Text>
						<CalendarOverlay year={currentYear} month={index + 1} />
					</View>
				))}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#E9ECF5',
	},
	scrollContainer: {
		alignItems: 'center',
		paddingVertical: Math.round(2 * scaleFactor),
	},
	calendarContainer: {
		alignItems: 'center',
		marginTop: Math.round(8 * scaleFactor),
	},
	monthBlock: {
		marginBottom: Math.round(2 * scaleFactor),
		alignItems: 'flex-start',
	},
	monthTitle: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(16 * scaleFactor),
		marginBottom: Math.round(2 * scaleFactor),
		marginLeft: Math.round(8*scaleFactor),
		color: '#18122B',
	},
	yearTitle: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(20*scaleFactor),
		textAlign: 'center',
		color: '#18122B',
	},
	yearSelector: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: Math.round(2 * scaleFactor),
	},
	yearButton: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(20 * scaleFactor),
		marginHorizontal: Math.round(16 * scaleFactor),
		color: '#18122B',
	},
	legendContainer: {
		flexDirection: 'column',
		justifyContent: 'flex-start',
		alignItems: 'flex-start',
		marginVertical: Math.round(4 * scaleFactor),
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: Math.round(8 * scaleFactor),
	},
	legendText: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(14 * scaleFactor),
		marginLeft: Math.round(4 * scaleFactor),
		color: '#18122B',
		bottom: Math.round(1 * scaleFactor),
	},
	legendTitle: {
		fontFamily: 'Tiny5',
		fontSize: Math.round(8 * scaleFactor),
		marginLeft: Math.round(4 * scaleFactor),
	}
});