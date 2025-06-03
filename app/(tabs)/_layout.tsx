import { useImage, Canvas, Image as SkiaImage, FilterMode, MipmapMode } from '@shopify/react-native-skia';
import { Tabs } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';

const ORIGINAL_WIDTH = 144;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scaleFactor = SCREEN_WIDTH / ORIGINAL_WIDTH;
const ICON_SIZE = Math.round(16 * scaleFactor);
const pixelPerfectIconSize = ICON_SIZE + (ICON_SIZE % 2);
const ORIGINAL_HEIGHT = 32;
const HEIGHT = ORIGINAL_HEIGHT * scaleFactor;
const pixelPerfectHeight = Math.round(HEIGHT + (HEIGHT % 2));

const tabbarBackgroundImage = require('@/assets/images/tab.png');

function CustomTabBarBackground() {
	const image = useImage(tabbarBackgroundImage);

	if (!image) return null;

	return (
		<Canvas style={[StyleSheet.absoluteFillObject, { height: pixelPerfectHeight }]}>
			<SkiaImage
				image={image}
				x={0}
				y={0}
				width={SCREEN_WIDTH}
				height={pixelPerfectHeight}
				fit="contain"
				sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
			/>
		</Canvas>
	);
}

const icons = {
	profile: {
		unselected: require('@/assets/images/profile_icon_unselected.png'),
		selected: require('@/assets/images/profile_icon.png'),
	},
	list: {
		unselected: require('@/assets/images/clipboard_icon_unselected.png'),
		selected: require('@/assets/images/clipboard_icon.png'),
	},
	sky: {
		unselected: require('@/assets/images/telescope_icon_unselected.png'),
		selected: require('@/assets/images/telescope_icon.png'),
	},
	compass: {
		unselected: require('@/assets/images/compass_icon_unselected.png'),
		selected: require('@/assets/images/compass_icon.png'),
	},
	calendar: {
		unselected: require('@/assets/images/calendar_icon_unselected.png'),
		selected: require('@/assets/images/calendar_icon.png'),
	},
};

function SkiaTabIcon({ name, focused }: { name: keyof typeof icons; focused: boolean; }) {
	const image = useImage(focused ? icons[name].selected : icons[name].unselected);

	if (!image) return null;

	const verticalPadding = Math.round(20 * scaleFactor);

	return (
		<Canvas style={{ width: pixelPerfectIconSize, height: pixelPerfectIconSize, marginTop: verticalPadding }}>
			<SkiaImage
				image={image}
				x={0}
				y={0}
				width={pixelPerfectIconSize}
				height={pixelPerfectIconSize}
				fit="contain"
				sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
			/>
		</Canvas>
	);
}

export default function TabLayout() {
	return (
		<Tabs screenOptions={({ route }) => ({ 
			tabBarActiveTintColor: '#7A7D8D', 
			headerShown: false,
			tabBarShowLabel: false, 
			tabBarStyle: {
				position: 'absolute',
				height: pixelPerfectHeight,
				backgroundColor: 'transparent',
				borderTopWidth: 0, 
				elevation: 0, 
			},
			tabBarBackground: () => <CustomTabBarBackground />,
			tabBarIcon: ({ focused }) => <SkiaTabIcon name={route.name as keyof typeof icons} focused={focused} />,
		})}>
			<Tabs.Screen
				name="profile"
				options={{
					tabBarIcon: ({ focused }) => <SkiaTabIcon name="profile" focused={focused} />,
				}}
			/>
			<Tabs.Screen
				name="list"
				options={{
					tabBarIcon: ({ focused }) => <SkiaTabIcon name="list" focused={focused} />,
				}}
			/>
			<Tabs.Screen
				name="sky"
				options={{
					tabBarIcon: ({ focused }) => <SkiaTabIcon name="sky" focused={focused} />,
				}}
			/>
			<Tabs.Screen
				name="compass"
				options={{
					tabBarIcon: ({ focused }) => <SkiaTabIcon name="compass" focused={focused} />,
				}}
			/>
			<Tabs.Screen
				name="calendar"
				options={{
					tabBarIcon: ({ focused }) => <SkiaTabIcon name="calendar" focused={focused} />,
				}}
			/>
		</Tabs>
	);
}