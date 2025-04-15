import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import 'expo-router/entry';
import LoadingAnimation from '@/components/LoadingAnimation';

export const unstable_settings = {
	href: null,
};


export default function OnboardingScreen() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
		const timer = setTimeout(() => {
		  router.push('/list');
		}, 3000);
	
		return () => clearTimeout(timer);
	  }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
				<LoadingAnimation />
            </View>
        );
    }

    return (
        <ImageBackground source={require('@/assets/images/background.png')} style={styles.background}>
            <View style={styles.container}>
                <Text style={styles.text}>Vega</Text>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        resizeMode: 'cover',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontFamily: 'GothicPixels',
        fontSize: 42,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
		backgroundColor: 'E9ECF5'
    },
});