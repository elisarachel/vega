export default {
	expo: {
		"name": "vega-astronomy",
		"slug": "vega-astronomy",
		"version": "1.0.0",
		"orientation": "portrait",
		"icon": "./assets/images/icon.png",
		"scheme": "myapp",
		"userInterfaceStyle": "automatic",
		"newArchEnabled": true,
		"splash": {
			"image": "./assets/images/background.png",
			"resizeMode": "contain"
		},
		"ios": {
			"supportsTablet": true,
			"bundleIdentifier": "com.anonymous.vegaastronomy"
		},
		"android": {
			"adaptiveIcon": {
				"foregroundImage": "./assets/images/adaptive-icon.png",
				"backgroundColor": "#ffffff"
			},
			"permissions": [
				"ACCESS_FINE_LOCATION"
			],
			"package": "com.anonymous.vegaastronomy"
		},
		"web": {
			"bundler": "metro",
			"output": "static",
			"favicon": "./assets/images/favicon.png"
		},
		"plugins": [
			"expo-router",
			[
				"expo-splash-screen",
				{
					"image": "./assets/images/background.png",
					"resizeMode": "contain",
					"backgroundColor": "#ffffff"
				}
			],
			[
				"expo-sqlite",
				{
					"enableFTS": true,
					"useSQLCipher": true,
					"android": {
						"enableFTS": false,
						"useSQLCipher": false
					}
				}
			]
		],
		"experiments": {
			"typedRoutes": true
		},
		"extra": {
			"router": {
				"origin": false
			},
			"eas": {
				"projectId": "01616c86-a796-4df0-9d25-927622e5b747"
			},
			FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
			FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
			FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
			FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
			FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
			FIREBASE_APP_ID: process.env.FIREBASE_APP_ID
		}
	}
};
