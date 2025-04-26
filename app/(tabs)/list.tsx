import React, { useEffect, useState } from 'react';
import { View, ScrollView, Alert, StyleSheet, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Equator, Horizon, Body, Observer, SearchRiseSet, AstroTime } from 'astronomy-engine';
import Header from '@/components/Header';
import FilterHeader from '@/components/FilterHeader';
import SectionHeader from '@/components/SectionHeader';
import AstroCard from '@/components/AstroCard';
import LoadingAnimation from '@/components/LoadingAnimation';
import { getAstroType } from '@/services/database';
import FilterPopup from '@/components/FilterPopup';
import { getFavorites } from '@/services/favorites';

const ORIGINAL_DESIGN_WIDTH = 144;

const { width: screenWidth } = Dimensions.get('window');

const astroNamesPT: { [key: string]: string } = {
    'Mercury': 'Mercúrio',
    'Venus': 'Vênus',
    'Mars': 'Marte',
    'Jupiter': 'Júpiter',
    'Saturn': 'Saturno',
    'Moon': 'Lua',
    'Sun': 'Sol'
};

const astroNamesEN: { [key: string]: string } = {
    'mercurio': 'mercury',
    'venus': 'venus',
    'marte': 'mars',
    'jupiter': 'jupiter',
    'saturno': 'saturn',
    'lua': 'moon',
    'sol': 'sun'
};

const astroImages: { [key: string]: any } = {
	mercury: require('@/assets/images/mercury.png'),
	venus: require('@/assets/images/venus.png'),
	mars: require('@/assets/images/mars.png'),
	jupiter: require('@/assets/images/jupiter.png'),
	saturn: require('@/assets/images/saturn.png'),
	moon: require('@/assets/images/moon.png'),
	sun: require('@/assets/images/sun.png'),
};  

export default function HomeScreen() {
    const [location, setLocation] = useState<{ latitude: number; longitude: number; altitude: number } | null>(null);
    const [city, setCity] = useState('Carregando...');
	const [visibleAstros, setVisibleAstros] = useState<{ 
		now: { name: string; time: string; icon: string, type: string }[], 
		soon: { name: string; time: string; icon: string, type: string }[] 
	}>({ now: [], soon: [] });
	const [isLoading, setIsLoading] = useState(true);
	const [selectedType, setSelectedType] = useState<string | null>(null);
	const [isFilterPopupVisible, setIsFilterPopupVisible] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);

	useEffect(() => {
		const interval = setInterval(() => {
			console.log("Atualizando dados...");
			getLocation(); // Atualiza a localização e os astros visíveis
		}, 60000); // Atualiza a cada 60 segundos (60000 ms)
	
		return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
	}, []);

    useEffect(() => {
        const setupNotifications = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Por favor, permita o envio de notificações nas configurações do dispositivo.');
            }
        };

        const fetchFavorites = async () => {
            const favs = await getFavorites();
            setFavorites(favs);
        };

        setupNotifications();
        fetchFavorites();
    }, []);

    // Função para obter a localização do usuário
    const getLocation = async () => {
        try {
            setIsLoading(true);
            
            // 1. Verificar permissões
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão necessária', 'Por favor, permita o acesso à localização nas configurações do dispositivo');
                setIsLoading(false);
                return;
            }

            // 2. Obter localização
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });
            
            // 3. Atualizar estado da localização
            setLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                altitude: location.coords.altitude || 0
            });

            // 4. Reverse geocoding
            const addresses = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
            
            if (addresses.length > 0) {
				const address = addresses[0];
				setCity(
					address.city || 
					address.subregion || 
					address.region || 
					'Local desconhecido'
				);
			}

            // 5. Calcular astros visíveis
            getVisibleAstros(
                location.coords.latitude,
                location.coords.longitude,
                location.coords.altitude || 0
            );

        } catch (error) {
            Alert.alert('Erro', 'Não foi possível obter a localização');
            console.error('Erro na localização:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Função para calcular astros visíveis com Astronomy Engine
    const getVisibleAstros = async (lat: number, lon: number, height: number) => {
		try {
			const now = new Date();
			const observer = new Observer(lat, lon, height);
			const astros = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Moon', 'Sun'];
	
			// Calcula a posição do Sol
			const sunEquator = Equator(Body.Sun, now, observer, true, true);
			const sunHorizon = Horizon(now, observer, sunEquator.ra, sunEquator.dec, 'normal');
			const isDaytime = sunHorizon.altitude > 0;

			const sunRise = SearchRiseSet(Body.Sun, observer, +1, new AstroTime(now), 1);
			const sunSet = SearchRiseSet(Body.Sun, observer, -1, new AstroTime(now), 1);
			const isNight = sunSet ? now > sunSet.date : false;

			
	
			const results = await Promise.all(astros.map(async (astro) => {
				const equator = Equator(astro as Body, now, observer, true, true);
				const horizon = Horizon(now, observer, equator.ra, equator.dec, 'normal');
				const riseTime = SearchRiseSet(astro as Body, observer, +1, new AstroTime(now), 1);
				const setTime = SearchRiseSet(astro as Body, observer, -1, new AstroTime(now), 1);
	
				const formattedRise = riseTime ? formatTime(riseTime.date) : '--:--';
				const formattedSet = setTime ? formatTime(setTime.date) : '--:--';
	
				const type = await getAstroType(astroNamesPT[astro]);
	
				if (horizon.altitude > 0 && (!isDaytime || astro === 'Sun' || astro == 'Moon')) {
					return {
						target: 'now',
						data: {
							name: astro,
							time: `Até ${formattedSet}`,
							icon: `@/assets/images/${astro.toLowerCase()}.png`,
							type
						}
					};
				} else if (riseTime && setTime && (
					riseTime.date.getTime() - now.getTime() < 12 * 3600 * 1000 &&
					(sunSet === null || riseTime.date > sunSet.date || isNight || astro === 'Sun' || astro === 'Moon')
				)) {
					return {
						target: 'soon',
						data: {
							name: astro,
							time: `Nasce às ${formattedRise}`,
							icon: `@/assets/images/${astro.toLowerCase()}.png`,
							type
						}
					};
				}
				return null;
			}));

		const visibleNow = results.filter(r => r?.target === 'now').map(r => r!.data);
		const visibleSoon = results.filter(r => r?.target === 'soon').map(r => r!.data);

		visibleNow.sort((a, b) => timeToNumber(a.time) - timeToNumber(b.time));
		visibleSoon.sort((a, b) => timeToNumber(a.time) - timeToNumber(b.time));

		setVisibleAstros({ now: visibleNow, soon: visibleSoon });

		} catch (error) {
			console.error('Erro no cálculo:', error);
			setVisibleAstros({ now: [], soon: [] });
		}
	};

	const timeToNumber = (time: string) => {
		const now = new Date();
		const timeMatch = time.match(/(\d{2}:\d{2})/);
		if (!timeMatch) return 0;
		const [hours, minutes] = timeMatch[0].split(':').map(Number);
		let timeNumber = hours * 60 + minutes;
		if (timeNumber < now.getHours() * 60 + now.getMinutes()) {
			timeNumber += 24 * 60;
		}
		return timeNumber;
	};

	// Função auxiliar para formatar horas
	const formatTime = (date: Date) => {
		return date.toLocaleTimeString('pt-BR', { 
			hour: '2-digit', 
			minute: '2-digit',
			hour12: false 
		}).slice(0, 5);
	};

    const checkFavoritesVisibility = (visibleAstrosNow: { name: string }[]) => {
        const visibleFavorites = visibleAstrosNow.filter((astro) =>
            favorites.includes(astroNamesPT[astro.name] || astro.name)
        );

        visibleFavorites.forEach((astro) => {
            Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Astro visível!',
                    body: `${astroNamesPT[astro.name] || astro.name} está visível agora!`,
                    data: { astro },
                },
                trigger: null, // Envia imediatamente
            });
        });
    };

    useEffect(() => {
        if (visibleAstros.now.length > 0) {
            checkFavoritesVisibility(visibleAstros.now);
        }
    }, [visibleAstros.now]);

    useEffect(() => {
        let isMounted = true;
        if (isMounted) {
            getLocation();
        }
        return () => { isMounted = false; };
    }, []);

    return (
        <View style={{flex: 1, backgroundColor: "#e9ecf5"}}>
            <Header
                background={require('@/assets/images/header.png')}
                city={city}
                pinIcon={require('@/assets/images/pin_pink_outlined.png')}
            />

            <FilterHeader title="ASTROS" filterIcon={require('@/assets/images/filter_icon.png')}
			onPress={() => setIsFilterPopupVisible(true)} />

			<FilterPopup
				visible={isFilterPopupVisible}
				onClose={() => setIsFilterPopupVisible(false)}
				onSelect={(type) => {
					if (type === 'Favoritos') {
						setSelectedType('Favoritos');
					} else {
						setSelectedType(type);
					}
					setIsFilterPopupVisible(false);
				}}
			/>

            {isLoading ? (
				<View style={styles.container}>
					<LoadingAnimation />
				</View>
			) : (
				<ScrollView>
					{/* Visíveis Agora */}
					{visibleAstros.now.length > 0 && (
						<>
							<SectionHeader icon={require('@/assets/images/eye_icon.png')} text="Visíveis agora" />
							{visibleAstros.now.map((astro, index) => {
								// Ensure consistent rendering logic
								const isFavorite = favorites.includes((astroNamesPT[astro.name] || astro.name).toLowerCase());
								if (selectedType === 'Favoritos' && !isFavorite) return null;
								if (selectedType && selectedType !== astro.type && selectedType !== 'Favoritos') return null;

								return (
									<AstroCard
										key={`now-${index}`}
										background={require('@/assets/images/blue_card.png')}
										icon={astroImages[astroNamesEN[astro.name.toLowerCase()]] || astroImages[astro.name.toLowerCase()]}
										name={astroNamesPT[astro.name]}
										time={astro.time}
										isVisible={true}
									/>
								);
							})}
						</>
					)}

					{/* Visíveis em Breve */}
					{visibleAstros.soon.length > 0 && (
						<>
							<SectionHeader icon={require('@/assets/images/rise_icon.png')} text="Visíveis em breve" />
							{visibleAstros.soon.map((astro, index) => {
								// Ensure consistent rendering logic
								const isFavorite = favorites.includes((astroNamesPT[astro.name] || astro.name).toLowerCase());
								if (selectedType === 'Favoritos' && !isFavorite) return null;
								if (selectedType && selectedType !== astro.type && selectedType !== 'Favoritos') return null;

								return (
									<AstroCard
										key={`soon-${index}`}
										background={require('@/assets/images/purple_card.png')}
										icon={astroImages[astroNamesEN[astro.name.toLowerCase()]] || astroImages[astro.name.toLowerCase()]}
										name={astroNamesPT[astro.name]}
										time={astro.time}
										isVisible={false}
									/>
								);
							})}
						</>
					)}

					{/* Caso nenhum esteja visível */}
					{visibleAstros.now.length === 0 && visibleAstros.soon.length === 0 && (
						<AstroCard
							background={require('@/assets/images/blue_card.png')}
							icon={require('@/assets/images/moon.png')}
							name="Nenhum astro visível nas próximas horas"
							time=""
							isVisible={false}
						/>
					)}
				</ScrollView>
			)}
        </View>
    );
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#E9ECF5',
		marginBottom: Math.round(52*(screenWidth / ORIGINAL_DESIGN_WIDTH)),
	},
});