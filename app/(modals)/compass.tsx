import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { Canvas, Image, useImage, Group, Skia, Rect, FilterMode, MipmapMode } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { Body, Observer, Equator, Horizon, AstroTime, Illumination } from 'astronomy-engine';
import * as Location from 'expo-location';
import * as Sensors from 'expo-sensors';
import PageHeader from '@/components/PageHeader';
import { astroIcons } from './name/[name]';
import { useLocalSearchParams } from 'expo-router';
import LoadingAnimation from '@/components/LoadingAnimation';

const needleFrames = {
	0: require('@/assets/images/needle_frames/compass_needle0.png'),
	22.5: require('@/assets/images/needle_frames/compass_needle22,5.png'),
	45: require('@/assets/images/needle_frames/compass_needle45.png'),
	67.5: require('@/assets/images/needle_frames/compass_needle67,5.png'),
	90: require('@/assets/images/needle_frames/compass_needle90.png'),
	112.5: require('@/assets/images/needle_frames/compass_needle112,5.png'),
	135: require('@/assets/images/needle_frames/compass_needle135.png'),
	157.5: require('@/assets/images/needle_frames/compass_needle157,5.png'),
	180: require('@/assets/images/needle_frames/compass_needle180.png'),
	202.5: require('@/assets/images/needle_frames/compass_needle202,5.png'),
	225: require('@/assets/images/needle_frames/compass_needle225.png'),
	247.5: require('@/assets/images/needle_frames/compass_needle247,5.png'),
	270: require('@/assets/images/needle_frames/compass_needle270.png'),
	292.5: require('@/assets/images/needle_frames/compass_needle292,5.png'),
	315: require('@/assets/images/needle_frames/compass_needle315.png'),
	337.5: require('@/assets/images/needle_frames/compass_needle337,5.png'),
};

const thermometer_frames = {
	0: require('@/assets/images/thermometer_frames/thermometer_frame0.png'),
	7.5: require('@/assets/images/thermometer_frames/thermometer_frame7,5.png'),
	15: require('@/assets/images/thermometer_frames/thermometer_frame15.png'),
	22.5: require('@/assets/images/thermometer_frames/thermometer_frame22,5.png'),
	30: require('@/assets/images/thermometer_frames/thermometer_frame30.png'),
	37.5: require('@/assets/images/thermometer_frames/thermometer_frame37,5.png'),
	45: require('@/assets/images/thermometer_frames/thermometer_frame45.png'),
	52.5: require('@/assets/images/thermometer_frames/thermometer_frame52,5.png'),
	60: require('@/assets/images/thermometer_frames/thermometer_frame60.png'),
	67.5: require('@/assets/images/thermometer_frames/thermometer_frame67,5.png'),
	75: require('@/assets/images/thermometer_frames/thermometer_frame75.png'),
	82.5: require('@/assets/images/thermometer_frames/thermometer_frame82,5.png'),
	90: require('@/assets/images/thermometer_frames/thermometer_frame90.png'),
}


const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const ORIGINAL_DESIGN_WIDTH = 144;
const STAR_SIZE = 5;

const COMPASS_SIZE = SCREEN_WIDTH * 0.85;

const SCALE_FACTOR = COMPASS_SIZE / 119;

const NEEDLE_WIDTH = 79 * SCALE_FACTOR;
const NEEDLE_HEIGHT = 79 * SCALE_FACTOR;

const THERMO_HEIGHT = 119 * SCALE_FACTOR;
const THERMO_WIDTH = 12 * SCALE_FACTOR;

const getMagnitude = (body: Body): number => {
	try {
		return Illumination(body, new AstroTime(new Date())).mag;
	}
	catch (error) {
		console.error(`Erro ao obter a magnitude de ${body}:`, error);
		return 0;
	}
}

export default function CompassScreen() {
	const [astroPosition, setAstroPosition] = useState<{ azimuth: number; altitude: number } | null>(null);
	const [deviceHeading, setDeviceHeading] = useState(0);
	const [location, setLocation] = useState<Observer | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [devicePitch, setDevicePitch] = useState(0);

	// Obtém os parâmetros da URL (nome do astro)
	const { slug } = useLocalSearchParams();
	const selectedBody = getBodyFromSlug(slug as string);

	useEffect(() => {
		const setup = async () => {
			// Permissões de localização
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status === 'granted') {
				const loc = await Location.getCurrentPositionAsync({});
				setLocation(new Observer(loc.coords.latitude, loc.coords.longitude, loc.coords.altitude || 0));
			}

			// Configuração do magnetômetro
			Sensors.Magnetometer.setUpdateInterval(100);
			Sensors.Magnetometer.addListener(({ x, y }) => {
				let heading = Math.atan2(-x, y) * (180 / Math.PI);
				if (heading < 0) heading += 360;
				setDeviceHeading(heading);
			});
		};

		setIsLoading(false);

		setup();
		return () => {
			Sensors.Magnetometer.removeAllListeners();
		};
	}, []);

	useEffect(() => {
		const subscription = Sensors.DeviceMotion.addListener((motion) => {
			if (!motion.rotation) return;
	
			// motion.rotation.beta é a inclinação frontal (pitch), em radianos
			let pitch = motion.rotation.beta * (180 / Math.PI); // graus
	
			// Normaliza para 0 a 90 (de apontando para baixo até apontando para o céu)
			let normalizedPitch = Math.max(0, Math.min(90, 90 - pitch)); // 90 olhando reto, 0 apontando para baixo
	
			setDevicePitch(normalizedPitch);
		});
	
		Sensors.DeviceMotion.setUpdateInterval(100);
	
		return () => subscription.remove();
	}, []);

	// Atualiza a posição do astro a cada segundo
	useEffect(() => {
		if (!location) return;

		const interval = setInterval(() => {
			const time = new AstroTime(new Date());
			const equatorial = Equator(selectedBody, time, location, true, true);
			const horizontal = Horizon(time, location, equatorial.ra, equatorial.dec);
			setAstroPosition({ azimuth: horizontal.azimuth, altitude: horizontal.altitude });
		}, 1000);

		return () => clearInterval(interval);
	}, [location, selectedBody]);

	if (isLoading || !astroPosition) {
		return (
		<View style={styles.container}>
		<PageHeader
				background={require('@/assets/images/header2_pink.png')}
				icon={astroIcons[getBodyName(selectedBody)]}
				text={getBodyName(selectedBody)}
			/>
		<View style={styles.loadingContainer}>
			<LoadingAnimation/>
		</View>
		</View>
		);	
	}

	return (
		<View style={styles.container}>
			<PageHeader
				background={require('@/assets/images/header2_pink.png')}
				icon={astroIcons[getBodyName(selectedBody)]}
				text={getBodyName(selectedBody)}
			/>

			{/* Informações do Astro Acima da Bússola */}
			{astroPosition && (
				<View style={styles.infoContainer}>
					<View style={styles.infoRow}>
						<Text style={styles.label}>AZIMUTE:</Text>
						<Text style={styles.value}>{astroPosition.azimuth.toFixed(2)}°</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.label}>ALTITUDE:</Text>
						<Text style={styles.value}>{astroPosition.altitude.toFixed(2)}°</Text>
					</View>
					<View style={styles.infoRow}>
						<Text style={styles.label}>MAGNITUDE:</Text>
						<Text style={styles.value}>{getMagnitude(selectedBody).toFixed(2)}</Text>
					</View>
				</View>
			)}

			{astroPosition && (
				<>
					<CompassVisualization deviceHeading={deviceHeading} astroAzimuth={astroPosition.azimuth} />
					<AltitudeIndicator altitude={astroPosition.altitude} devicePitch={devicePitch} />
				</>
			)}
		</View>
	);
}

const CompassVisualization = ({ deviceHeading, astroAzimuth }: { deviceHeading: number; astroAzimuth: number }) => {
	const angle = (astroAzimuth - deviceHeading + 360) % 360; 
		const step = 22.5;
		const nearest = Math.round(angle / step) * step;
		const needleFrame = nearest % 360 as keyof typeof needleFrames;

		const needleImage = useImage(needleFrames[needleFrame]);
		const compassBase = useImage(require('@/assets/images/compass_background.png'));

	return (
		<View style={styles.compassContainer}>
			<Canvas style={{ width: COMPASS_SIZE, height: COMPASS_SIZE }}>
				{compassBase && (
					<Image image={compassBase} x={0} y={0} width={COMPASS_SIZE} height={COMPASS_SIZE} fit="contain" 
					sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}/>
				)}

				{/* Renderiza a agulha como um frame específico */}
				{needleImage && (
					<Image image={needleImage} x={COMPASS_SIZE / 2 - NEEDLE_WIDTH / 2} y={COMPASS_SIZE / 2 - NEEDLE_HEIGHT / 2} width={NEEDLE_WIDTH} height={NEEDLE_HEIGHT} fit="contain" 
					sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}/>
				)}
			</Canvas>
		</View>
	);
};

// Indicador de Altitude (Termômetro)
const AltitudeIndicator = ({ altitude, devicePitch }: { altitude: number, devicePitch: number }) => {

	const bgImage = useImage(require('@/assets/images/thermometer.png'));
	const starImage = useImage(require('@/assets/images/mini_star.png'));

	const maxHeight = THERMO_HEIGHT

	const step = 7.5;
	const clampedAltitude = Math.max(0, Math.min(devicePitch, 90));
	const nearest = Math.round(clampedAltitude / step) * step;
	const frame = nearest % 90 as keyof typeof thermometer_frames;
	const fillImage = useImage(thermometer_frames[frame]);

	const targetY = maxHeight - (altitude / 90) * maxHeight;

	if (!bgImage) return null;

	return (
		<View style={styles.altitudeContainer}>
			<Canvas style={{ width: THERMO_WIDTH, height: THERMO_HEIGHT }}>

				{/* Preenchimento */}
				<Image
					image={fillImage}
					x={0}
					y={0}
					width={THERMO_WIDTH}
					height={THERMO_HEIGHT}
					fit="contain"
					sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
				/>

				{starImage && (
					<Image
						image={starImage}
						x={(THERMO_WIDTH - (STAR_SIZE*SCALE_FACTOR)) / 4}
						y={targetY - STAR_SIZE / 2}
						width={STAR_SIZE*SCALE_FACTOR}
						height={STAR_SIZE*SCALE_FACTOR}
						fit="contain"
						sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
					/>
				)}

				{/* Termômetro contorno */}
				<Image
					image={bgImage}
					x={0}
					y={0}
					width={THERMO_WIDTH}
					height={THERMO_HEIGHT}
					fit="contain"
					sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
				/>
			</Canvas>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#E9ECF5',
		marginTop: Math.round(1 * (SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
	},
	compassContainer: {
		marginTop: Math.round(8 * (SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
		marginLeft: Math.round(18*(SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
		width: COMPASS_SIZE,
		height: COMPASS_SIZE,
	},
	altitudeContainer: {
		width: Math.round(50*(SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
		position: 'absolute',
		marginTop: Math.round(80 * (SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
		marginLeft: Math.round(4*(SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: Math.round(2 * (SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
		paddingBottom: 6,
	},
	infoContainer: {
		paddingHorizontal: Math.round(8 * (SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
		paddingTop: Math.round(6 * (SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
	},
	label: {
		fontFamily: 'Tiny5',
		color: '#18122B',
		fontSize: Math.round(6 * (SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
	},
	value: {
		fontFamily: 'TinyUnicode',
		color: '#7A7D8D',
		fontSize: Math.round(12 * (SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: Math.round(32 * (SCREEN_WIDTH / ORIGINAL_DESIGN_WIDTH)),
	}
});

// Função para traduzir o nome dos corpos celestes
const getBodyName = (body: Body): string => {
	const bodyNameMap: Partial<Record<Body, string>> = {
		[Body.Sun]: 'Sol',
		[Body.Moon]: 'Lua',
		[Body.Mars]: 'Marte',
		[Body.Mercury]: 'Mercúrio',
		[Body.Venus]: 'Vênus',
		[Body.Jupiter]: 'Júpiter',
		[Body.Saturn]: 'Saturno',
	};
	return bodyNameMap[body] || 'Desconhecido';
};

// Mapeia os slugs para os corpos celestes
const getBodyFromSlug = (slug: string): Body => {
	const bodyMap: Record<string, Body> = {
		sol: Body.Sun,
		lua: Body.Moon,
		marte: Body.Mars,
		mercurio: Body.Mercury,
		venus: Body.Venus,
		jupiter: Body.Jupiter,
		saturno: Body.Saturn,
	};
	return bodyMap[slug] || Body.Sun;
};
