import { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { MoonPhase } from 'astronomy-engine';
import * as Location from 'expo-location';

// Mapeamento dos ícones do tempo
const weatherIcons = {
	'Céu limpo': require('@/assets/images/ceulimpo.png'),
	'Parcialmente nublado': require('@/assets/images/parcialmentenublado.png'),
	'Nublado': require('@/assets/images/nublado.png'),
	'Chuva': require('@/assets/images/chuvoso.png'),
	'Neve': require('@/assets/images/neve.png'),
	'Tempestade': require('@/assets/images/tempestade.png'),
	'Desconhecido': require('@/assets/images/parcialmentenublado.png')
};

// Mapeamento dos códigos de clima para descrições
const weatherCodeToDescription = (code: number): keyof typeof weatherIcons => {
	if ([0].includes(code)) return 'Céu limpo';
	if ([1, 2].includes(code)) return 'Parcialmente nublado';
	if ([3, 45, 48].includes(code)) return 'Nublado';
	if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Chuva';
	if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Neve';
	if ([95, 96, 99].includes(code)) return 'Tempestade';
	return 'Desconhecido';
};

export function useDayInfo(dateParam?: string) {
	const [moonPhase, setMoonPhase] = useState<'nova' | 'crescente' | 'cheia' | 'minguante' | null>(null);
	const [weatherDescription, setWeatherDescription] = useState<keyof typeof weatherIcons | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const eventDate = dateParam ? DateTime.fromISO(dateParam) : DateTime.now();

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

		const fetchWeather = async () => {
			try {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== 'granted') {
					console.warn('Sem permissão de localização.');
					return;
				}

				const location = await Location.getCurrentPositionAsync({});
				const lat = location.coords.latitude;
				const lon = location.coords.longitude;
				const dateStr = eventDate.toISODate();

				const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`);
				const data = await response.json();

				if (data.daily && data.daily.weathercode && data.daily.weathercode.length > 0) {
					const code = data.daily.weathercode[0];
					if (isMounted) {
						setWeatherDescription(weatherCodeToDescription(code));
					}
				}
			} catch (error) {
				console.error('Erro ao buscar clima:', error);
			}
		};

		setIsLoading(true);
		calculateMoonPhase();
		fetchWeather().finally(() => {
			if (isMounted) setIsLoading(false);
		});

		return () => {
			isMounted = false;
		};
	}, [dateParam]);

	return {
		isLoading,
		moonPhase,
		weatherDescription,
		weatherIcon: weatherDescription ? weatherIcons[weatherDescription] : null,
	};
}
