import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Alert,
    Text,
    TouchableOpacity,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import { Canvas, Image, useImage, Skia } from '@shopify/react-native-skia';
import * as Location from 'expo-location';
import { Body, Observer, Equator, Horizon, AstroTime } from 'astronomy-engine';
import LoadingAnimation from '@/components/LoadingAnimation'; // Adjust path if needed
import {
    ViroARScene,
    ViroARSceneNavigator,
    ViroMaterials,
    ViroImage,
    ViroNode,
    ViroText,
    ViroTrackingStateConstants,
} from '@reactvision/react-viro';

// --- Constants --- 

// Placeholder asset paths (User needs to create these)
const PLACEHOLDER_SKY_BACKGROUND_PATH = '@/assets/images/placeholder_sky_background.png';
const PLACEHOLDER_AR_LABEL_BG_PATH = '@/assets/images/placeholder_ar_label_background.png';
// const PLACEHOLDER_STARFIELD_PATH = '@/assets/images/placeholder_starfield.png'; // Optional static
// const PLACEHOLDER_HORIZON_PATH = '@/assets/images/placeholder_horizon.png'; // Optional static
// const PLACEHOLDER_AR_POINTER_PATH = '@/assets/images/placeholder_ar_pointer.png'; // Optional AR

// Existing assets (adjust paths if needed)
const astroImageSources: { [key: string]: any } = {
    sun: require('@/assets/images/sun.png'),
    moon: require('@/assets/images/moon.png'),
    mercury: require('@/assets/images/mercury.png'),
    venus: require('@/assets/images/venus.png'),
    mars: require('@/assets/images/mars.png'),
    jupiter: require('@/assets/images/jupiter.png'),
    saturn: require('@/assets/images/saturn.png'),
};

const bodiesToTrack: Body[] = [
    Body.Sun, Body.Moon, Body.Mercury, Body.Venus, Body.Mars, Body.Jupiter, Body.Saturn
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STATIC_BODY_ICON_SIZE = 32; // Size for static view icons
const AR_BODY_ICON_SCALE = 0.1; // Scale for AR sprites (adjust based on distance)
const AR_DISTANCE = 5; // Virtual distance for AR objects (meters)

// --- Helper Functions --- 

// Static view mapping
const mapCoordsToScreen = (azimuth: number, altitude: number, width: number, height: number) => {
    const x = (azimuth / 360) * width;
    const y = height - (altitude / 90) * height;
    return { x, y };
};

// Get body name string (lowercase)
const getBodyNameLower = (body: Body): string => {
    const name = Body[body];
    return name.toLowerCase();
};

// Get body name string (Proper Case)
const getBodyNameProper = (body: Body): string => {
    const name = Body[body];
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

// Convert Alt/Az to Viro Cartesian coordinates
const mapAltAzToViroCartesian = (altitude: number, azimuth: number, radius: number): [number, number, number] => {
    const altitudeRad = altitude * (Math.PI / 180);
    const azimuthRad = azimuth * (Math.PI / 180);

    // Viro uses Right-Handed Y-up coordinate system.
    // X: East, Y: Up, Z: South
    const x = radius * Math.cos(altitudeRad) * Math.sin(azimuthRad);
    const y = radius * Math.sin(altitudeRad);
    const z = -radius * Math.cos(altitudeRad) * Math.cos(azimuthRad);

    return [x, y, z];
};

// --- AR Scene Component --- 
const SkyARScene = ({ celestialPositions }: { celestialPositions: Record<string, { azimuth: number; altitude: number }> }) => {
    const [trackingInitialized, setTrackingInitialized] = useState(false);

    const onTrackingUpdated = (state: any, _reason: any) => {
        if (state === ViroTrackingStateConstants.TRACKING_NORMAL) {
            setTrackingInitialized(true);
        } else if (state === ViroTrackingStateConstants.TRACKING_UNAVAILABLE) {
            // Handle tracking loss if needed
            setTrackingInitialized(false);
        }
    };

    return (
        <ViroARScene onTrackingUpdated={onTrackingUpdated}>
            {!trackingInitialized && (
                <ViroText
                    text="Initializing AR... Point device around."
                    scale={[0.5, 0.5, 0.5]}
                    position={[0, 0, -1]} // In front of the user
                    style={styles.arTextStyle}
                />
            )}

            {trackingInitialized && Object.entries(celestialPositions)
                .filter(([_, position]) => position.altitude > 0) // Only bodies above horizon
                .map(([name, position]) => {
                    const bodyPosition = mapAltAzToViroCartesian(position.altitude, position.azimuth, AR_DISTANCE);
                    const materialName = name + '_mat';


                    return (
                        <ViroNode
                            key={name}
                            position={bodyPosition}
                            transformBehaviors={['billboardY']} // Keep sprite facing the user (Y-axis rotation only)
                        >
                            {/* Body Sprite */}
                            <ViroImage
                                width={AR_BODY_ICON_SCALE}
                                height={AR_BODY_ICON_SCALE}
                                source={astroImageSources[name]} // Add source prop
                                materials={[materialName]} // Keep materials for filtering
                            />
                            {/* Optional Label Below Sprite */}
                            <ViroNode position={[0, -AR_BODY_ICON_SCALE * 0.7, 0]}> // Position label below image
                                {/* Label Background (Optional) */}
                                {/* <ViroImage 
                                    width={0.15} 
                                    height={0.05} 
                                    materials={['label_bg_mat']} 
                                /> */} 
                                <ViroText
                                    text={getBodyNameProper(Body[name.charAt(0).toUpperCase() + name.slice(1) as keyof typeof Body])} // Get proper name
                                    scale={[0.1, 0.1, 0.1]} // Adjust text scale
                                    style={{ ...styles.arTextStyle, textAlign: "center", textAlignVertical: "center" }} // Move alignment props into style
                                    // position={[0, 0, 0.01]} // Slightly in front of background if using one
                                />
                            </ViroNode>
                        </ViroNode>
                    );
                })
            }
        </ViroARScene>
    );
};

// --- Main Sky Component --- 

export default function Sky() {
    const [location, setLocation] = useState<Observer | null>(null);
    const [celestialPositions, setCelestialPositions] = useState<Record<string, { azimuth: number; altitude: number }>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isARMode, setIsARMode] = useState(false);
    const [hasARPermissions, setHasARPermissions] = useState(false);

    // --- Move Viro Materials Definition Inside useEffect --- 
    useEffect(() => {
        ViroMaterials.createMaterials({
            // Create a material for each body to ensure nearest filtering
            ...bodiesToTrack.reduce((acc, body) => {
                const nameLower = getBodyNameLower(body);
                if (astroImageSources[nameLower]) {
                    acc[nameLower + '_mat'] = {
                        diffuseTexture: astroImageSources[nameLower],
                        lightingModel: 'Constant', // Ignore scene lighting for sprites
                        writesToDepthBuffer: false, // Render on top potentially
                        readsFromDepthBuffer: false,
                        // --- Crucial for Pixel Art --- 
                        minificationFilter: 'Nearest',
                        magnificationFilter: 'Nearest',
                        mipmapMode: 'None', // Disable mipmapping if possible/needed
                    };
                }
                return acc;
            }, {} as any),
            // Material for AR labels
            label_bg_mat: {
                diffuseTexture: require(PLACEHOLDER_AR_LABEL_BG_PATH), // User needs to create this
                lightingModel: 'Constant',
                minificationFilter: 'Nearest',
                magnificationFilter: 'Nearest',
                mipmapMode: 'None',
            }
        });
    }, []); // Empty dependency array ensures this runs only once on mount

    // --- Skia Image Loading (for Static View) --- 
    const skyBgImage = useImage(require(PLACEHOLDER_SKY_BACKGROUND_PATH)); // User needs to create this
    const bodyImages = bodiesToTrack.reduce((acc, body) => {
        const nameLower = getBodyNameLower(body);
        if (astroImageSources[nameLower]) {
            acc[nameLower] = useImage(astroImageSources[nameLower]);
        }
        return acc;
    }, {} as Record<string, ReturnType<typeof useImage>>);
    // --- End Skia Image Loading --- 

    // --- Permissions --- 
    const requestARPermissions = useCallback(async () => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'App needs camera access for AR view.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    setHasARPermissions(true);
                    return true;
                } else {
                    setErrorMsg('AR Camera permission denied');
                    setHasARPermissions(false);
                    return false;
                }
            } else {
                // iOS permissions are typically handled by ViroReact or Info.plist
                setHasARPermissions(true); // Assume granted for now on iOS, Viro will handle it
                return true;
            }
        } catch (err) {
            console.warn(err);
            setErrorMsg('Error requesting AR permissions.');
            setHasARPermissions(false);
            return false;
        }
    }, []);

    // --- Location and Astronomy Calculation (Shared) --- 
    useEffect(() => {
        let isMounted = true;
        const setupLocation = async () => {
            if (!isMounted) return;
            setIsLoading(true);
            setErrorMsg(null);
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    if (isMounted) setErrorMsg('Permission to access location was denied');
                    if (isMounted) setIsLoading(false);
                    return;
                }

                const loc = await Location.getCurrentPositionAsync({});
                if (isMounted) {
                    setLocation(new Observer(loc.coords.latitude, loc.coords.longitude, loc.coords.altitude || 0));
                }
            } catch (error) {
                console.error("Error getting location:", error);
                if (isMounted) setErrorMsg('Failed to get location.');
                if (isMounted) setIsLoading(false);
            }
        };

        setupLocation();

        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (!location) return;
        if (isLoading) setIsLoading(false);

        const calculatePositions = () => {
            const now = new AstroTime(new Date());
            const positions: Record<string, { azimuth: number; altitude: number }> = {};
            bodiesToTrack.forEach(body => {
                try {
                    const equatorial = Equator(body, now, location, true, true);
                    const horizontal = Horizon(now, location, equatorial.ra, equatorial.dec, 'normal');
                    const nameLower = getBodyNameLower(body);
                    positions[nameLower] = { azimuth: horizontal.azimuth, altitude: horizontal.altitude };
                } catch (e) { /* Ignore calculation errors */ }
            });
            setCelestialPositions(positions);
        };

        calculatePositions();
        const intervalId = setInterval(calculatePositions, 60000);
        return () => clearInterval(intervalId);
    }, [location]);
    // --- End Location and Astronomy Calculation --- 

    // --- Toggle Handler --- 
    const handleToggleMode = async () => {
        if (!isARMode) {
            // Switching to AR
            const permissionsGranted = await requestARPermissions();
            if (permissionsGranted) {
                setIsARMode(true);
            } else {
                // Stay in static mode if permissions denied
                setIsARMode(false);
            }
        } else {
            // Switching to Static
            setIsARMode(false);
        }
    };

    // --- Rendering Logic --- 
    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <LoadingAnimation />
            </View>
        );
    }

    if (errorMsg && !isARMode) { // Only show location/generic errors in static mode initially
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
                {/* Optional: Add a button to retry location? */}
            </View>
        );
    }

    const canvasWidth = SCREEN_WIDTH;
    // Adjust static view height to leave space for toggle button
    const staticCanvasHeight = SCREEN_HEIGHT - 60; // Example height, adjust as needed

    return (
        <View style={styles.container}>
            {isARMode && hasARPermissions ? (
                <ViroARSceneNavigator
                    autofocus={true}
                    initialScene={{
                        scene: () => <SkyARScene celestialPositions={celestialPositions} />,
                    }}
                    style={styles.arView}
                />
            ) : (
                // Static Skia View
                <Canvas style={{ width: canvasWidth, height: staticCanvasHeight }}>
                    {skyBgImage && (
                        <Image
                            image={skyBgImage}
                            x={0} y={0}
                            width={canvasWidth}
                            height={staticCanvasHeight}
                            fit="cover"
                        />
                    )}
                    {Object.entries(celestialPositions)
                        .filter(([_, position]) => position.altitude > 0)
                        .map(([name, position]) => {
                            const bodyImg = bodyImages[name];
                            if (!bodyImg) return null;
                            const { x, y } = mapCoordsToScreen(position.azimuth, position.altitude, canvasWidth, staticCanvasHeight);
                            return (
                                <Image
                                    key={name}
                                    image={bodyImg}
                                    x={x - STATIC_BODY_ICON_SIZE / 2}
                                    y={y - STATIC_BODY_ICON_SIZE / 2}
                                    width={STATIC_BODY_ICON_SIZE}
                                    height={STATIC_BODY_ICON_SIZE}
                                    fit="contain"
                                />
                            );
                        })}
                </Canvas>
            )}

            {/* Toggle Button - Positioned absolutely */} 
            <TouchableOpacity style={styles.toggleButton} onPress={handleToggleMode}>
                <Text style={styles.toggleButtonText}>{isARMode ? 'Show Static Map' : 'Show AR View'}</Text>
            </TouchableOpacity>

            {/* Show AR permission error message if relevant */} 
            {isARMode && !hasARPermissions && errorMsg && (
                 <View style={styles.arErrorOverlay}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000010', // Dark fallback background
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E9ECF5',
    },
    errorText: {
        color: 'red',
        fontFamily: 'TinyUnicode', // Use your app's font
        fontSize: 16,
        textAlign: 'center',
        padding: 20,
    },
    arView: {
        flex: 1,
    },
    toggleButton: {
        position: 'absolute',
        bottom: 30, // Adjust position as needed
        left: 20,
        right: 20,
        backgroundColor: 'rgba(100, 100, 200, 0.8)', // Example style
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        alignItems: 'center',
    },
    toggleButtonText: {
        color: 'white',
        fontFamily: 'TinyUnicode', // Use your app's font
        fontSize: 16,
    },
    arTextStyle: {
        fontFamily: 'TinyUnicode', // Use your app's font
        fontSize: 10, // Adjust AR text size
        color: '#ffffff',
        // textAlign: 'center', // Moved into ViroText style prop
        // textAlignVertical: 'center', // Moved into ViroText style prop
    },
    arErrorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    }
});

