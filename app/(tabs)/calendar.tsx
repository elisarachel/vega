import React, { useState } from 'react';
import Header from '@/components/Header';
import { Canvas, scale, Text as SkiaText, useFont, useImage, Image as SkiaImage } from '@shopify/react-native-skia';
import { DateTime } from 'luxon';
import { Dimensions, View, StyleSheet, Text, ScrollView, Modal, Pressable, TouchableOpacity } from 'react-native';
import eventData from '@/assets/data/2025_pt.json';
import { router } from 'expo-router';

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
	const font = useFont(require('@/assets/fonts/TinyUnicode.ttf'), 16 * scaleFactor);
	const calendarBackground = useImage(require('@/assets/images/calendar.png'));
	const eventIcon = useImage(require('@/assets/images/!.png')); // Load the event icon
	if (!font || !eventIcon) return null;

	const daysInMonth = DateTime.local(year, month).daysInMonth ?? 0;
	const startDay = DateTime.local(year, month, 1).weekday % 7; // Luxon: 1=Monday, JS: 0=Sunday

	// Extract events for the current month
	const events = eventData.VCALENDAR[0].VEVENT.filter((event) => {
		const eventDate = DateTime.fromISO(event.DTSTART);
		return eventDate.year === year && eventDate.month === month;
	}).reduce((acc: { [key: number]: any[] }, event) => {
		const eventDate = DateTime.fromISO(event.DTSTART);
		const day = eventDate.day;
		if (!acc[day]) acc[day] = [];
		acc[day].push(event);
		return acc;
	}, {});

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
			icon: events[day] ? (
				<SkiaImage
					key={`icon-${day}`}
					image={eventIcon}
					x={x + (10 * scaleFactor)}
					y={y + (14 * scaleFactor)}
					width={10 * scaleFactor}
					height={10 * scaleFactor}
				/>
			) : null,
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
			{cells.map(({ icon }) => icon)}
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

	const handleYearChange = (direction: 'prev' | 'next') => {
		setCurrentYear((prevYear: number) => (direction === 'prev' ? prevYear - 1 : prevYear + 1));
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
});