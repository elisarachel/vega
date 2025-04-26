import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import LoadingAnimation from '../components/LoadingAnimation';
import { Stack } from 'expo-router';
import { initDatabase } from '@/services/database';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		'GothicPixels': require('../assets/fonts/GothicPixels.ttf'),
		'TinyUnicode': require('../assets/fonts/TinyUnicode.ttf'),
		'Tiny5': require('../assets/fonts/Tiny5-Regular.ttf'),
		'CD-Icons': require('../assets/fonts/CD-IconsPC.ttf'),
		'Emoji': require('../assets/fonts/EmojiFont.ttf')
	});
	const [dbInitialized, setDbInitialized] = useState(false);

	useEffect(() => {
		if (fontsLoaded && dbInitialized) {
		  console.log("✅ Condições atendidas! Ocultando splash...");
		  SplashScreen.hideAsync();
		}
	  }, [fontsLoaded, dbInitialized]);

	  useEffect(() => {
		const initializeDatabase = async () => {
		  try {
			console.log("🔄 Iniciando banco de dados...");
			await initDatabase();
			console.log("✅ Banco inicializado!");
			setDbInitialized(true);
			
			onLayoutRootView(); 
		  } catch (error) {
			console.error("💥 Falha crítica:", error);
			Alert.alert("Erro", "Falha na inicialização do banco de dados");
		  }
		};
		initializeDatabase();
	  }, []);

	const onLayoutRootView = useCallback(async () => {
		console.log("Verificando condições para hide:", { 
			fontsLoaded, 
			dbInitialized 
		});
		
		if (fontsLoaded && dbInitialized) {
			console.log("Ocultando splash screen...");
			await SplashScreen.hideAsync();
		}
	}, [fontsLoaded, dbInitialized]);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<View style={{ flex: 1 }} onLayout={onLayoutRootView}>
				<Stack screenOptions={{ headerShown: false }} />
			</View>
		</GestureHandlerRootView>
	);
}
