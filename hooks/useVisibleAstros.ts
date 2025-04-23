import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Observer, Equator, Horizon, SearchRiseSet, AstroTime, Body } from 'astronomy-engine';

export default function useVisibleAstros() {
	const [location, setLocation] = useState<{ latitude: number; longitude: number; altitude: number } | null>(null);
	const [visibleAstros, setVisibleAstros] = useState<{ 
		now: any[], 
		soon: any[] 
	}>({ now: [], soon: [] });

	useEffect(() => {
		const fetchData = async () => {
			try {
				const { status } = await Location.requestForegroundPermissionsAsync();
				if (status !== 'granted') return;

				const loc = await Location.getCurrentPositionAsync();
				const observer = new Observer(loc.coords.latitude, loc.coords.longitude, loc.coords.altitude || 0);
				const now = new Date();

				const astros = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Moon', 'Sun'];
				const results = await Promise.all(astros.map(async (astro) => {
					const equator = Equator(astro as Body, now, observer, true, true);
					const horizon = Horizon(now, observer, equator.ra, equator.dec, 'normal');
					const riseTime = SearchRiseSet(astro as Body, observer, +1, new AstroTime(now), 1);
					const setTime = SearchRiseSet(astro as Body, observer, -1, new AstroTime(now), 1);

					return {
						name: astro,
						altitude: horizon.altitude,
						rise: riseTime?.date,
						set: setTime?.date
					};
				}));

				const nowList = results.filter(r => r.altitude > 0);
				const soonList = results.filter(r => r.altitude <= 0);

				setVisibleAstros({ now: nowList, soon: soonList });
				setLocation({
					latitude: loc.coords.latitude,
					longitude: loc.coords.longitude,
					altitude: loc.coords.altitude || 0
				});
			} catch (error) {
				console.error('Erro ao buscar astros:', error);
			}
		};

		fetchData();
	}, []);

	return { visibleAstros, location };
}
