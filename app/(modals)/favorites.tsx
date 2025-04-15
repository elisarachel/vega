import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AstroCard from '@/components/AstroCard';
import PageHeader from '@/components/PageHeader';
import { getFavorites } from '@/services/favorites';
import { getAstroBySlug } from '@/services/database';
import LoadingAnimation from '@/components/LoadingAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ORIGINAL_DESIGN_WIDTH = 144;

const astroImages: { [key: string]: any } = {
	mercury: require('@/assets/images/mercury.png'),
	venus: require('@/assets/images/venus.png'),
	mars: require('@/assets/images/mars.png'),
	jupiter: require('@/assets/images/jupiter.png'),
	saturn: require('@/assets/images/saturn.png'),
	moon: require('@/assets/images/moon.png'),
	sun: require('@/assets/images/sun.png'),
};

const astroNamesEN: { [key: string]: string } = {
    'Mercúrio': 'mercury',
    'Vênus': 'venus',
    'Marte': 'mars',
    'Júpiter': 'jupiter',
    'Saturno': 'saturn',
    'Lua': 'moon',
    'Sol': 'sun'
};

export default function FavoritesScreen() {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [astroDetails, setAstroDetails] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                setIsLoading(true);
                const favs = await getFavorites();
                setFavorites(favs);

                const details = await Promise.all(
                    favs.map(async (slug: string) => {
                        const astro = await getAstroBySlug(slug);
                        return astro;
                    })
                );
                setAstroDetails(details);
            } catch (error) {
                console.error("Error fetching favorites:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, []);

	if (isLoading) {
		return (
		<View style={styles.container}>
		<PageHeader
				background={require('@/assets/images/header2_purple.png')}
				icon={require('@/assets/images/favorite_icon.png')}
				text="Favoritos"
			/>
		<View style={styles.loadingContainer}>
			<LoadingAnimation/>
		</View>
		</View>
		);	
	}

    return (
        <View style={styles.container}>
            <View>
                <PageHeader
                    background={require('@/assets/images/header2_purple.png')}
                    icon={require('@/assets/images/favorite_icon.png')}
                    text="Favoritos"
                />
            </View>
                <ScrollView style={{paddingTop: 4*SCREEN_WIDTH/144}} showsVerticalScrollIndicator={false}>
                    {astroDetails.map((astro, index) => (
                        <AstroCard
                            key={index}
                            background={require('@/assets/images/blue_card.png')}
                            icon={astroImages[astroNamesEN[astro.name]] || require('@/assets/images/favorite_icon.png')}
                            name={astro.name}
                            time=""
							isVisible={false}
                        />
                    ))}
                </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
		backgroundColor: "#e9ecf5",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#e9ecf5",
    },
});
