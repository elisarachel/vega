import React, { useState } from 'react';
import Header from '@/components/Header';
import { Canvas, scale, Text as SkiaText, useFont, useImage, Image as SkiaImage } from '@shopify/react-native-skia';
import { DateTime } from 'luxon'; // ou use o próprio JS Date
import { Dimensions, View, StyleSheet, Text, ScrollView } from 'react-native';

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
	if (!font) return null;

	const daysInMonth = DateTime.local(year, month).daysInMonth;
	const startDay = DateTime.local(year, month, 1).weekday % 7; // Luxon: 1=Monday, JS: 0=Sunday

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

		cells.push(
			<SkiaText
				key={day}
				text={`${day}`}
				x={x + (2 * scaleFactor)} // ajuste fino para centralizar
				y={y + (18 * scaleFactor)} // ajuste fino vertical
				font={font}
				color="#18122B"
			/>
		);
	}

	return (
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
			{cells}
		</Canvas>
	);
};


export default function Calendar() {
	const [currentYear, setCurrentYear] = useState(DateTime.now().year); // Estado para o ano atual
	const currentMonth = DateTime.now().month; // Obtém o mês atual (1 = Janeiro, 12 = Dezembro)

	const handleYearChange = (direction: 'prev' | 'next') => {
		setCurrentYear((prevYear) => (direction === 'prev' ? prevYear - 1 : prevYear + 1));
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

			<ScrollView contentContainerStyle={styles.scrollContainer}>
				{monthNamesPT.slice(currentMonth - 1).map((monthName, index) => (
					<View key={index} style={styles.monthBlock}>
						<Text style={styles.monthTitle}>{monthName}</Text>
						<CalendarOverlay year={currentYear} month={currentMonth + index} />
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