import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet, Dimensions } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/services/firebaseConfig';
import { useRouter } from 'expo-router';
import { db } from '@/services/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import TextBox from '@/components/TextBox';
import IconButton from '@/components/Button';
import BackButton from '@/components/BackButton';

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;

export default function SignupScreen() {
	const router = useRouter();

	const [name, setName] = useState('');
	const [birthDate, setBirthDate] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const formatBirthDate = (text: string) => {
		// Remove caracteres não numéricos
		const cleaned = text.replace(/\D/g, '');

		// Formata como DD/MM/AAAA
		const formatted = cleaned
			.replace(/^(\d{2})(\d)/, '$1/$2')
			.replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
			.slice(0, 10);

		setBirthDate(formatted);
	};

	const handleSignup = async () => {
		if (!name || !birthDate || !email || !password) {
			Alert.alert('Erro', 'Preencha todos os campos.');
			return;
		}

		// Verifica se a senha atende aos critérios
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
		if (!passwordRegex.test(password)) {
			Alert.alert(
				'Erro',
				'A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.'
			);
			return;
		}

		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			await updateProfile(userCredential.user, {
				displayName: name
			});
			await setDoc(doc(db, 'users', userCredential.user.uid), {
				name: name,
				birthdate: birthDate,
				email: email,
				createdAt: new Date()
			});

			Alert.alert('Sucesso', 'Conta criada com sucesso!', [
				{
					text: 'OK',
					onPress: () => router.replace('/(tabs)/profile') // Redireciona para perfil logado
				}
			]);
		} catch (error: any) {
			Alert.alert('Erro', error.message);
		}
	};

	return (
		<View style={styles.container}>
			<BackButton />

			<Text style={styles.title}>CRIAR CONTA</Text>

			<TextBox placeholder="Nome" value={name} selectionColor="#18122b" onChangeText={setName} />
			<TextBox 
				placeholder="Data de nascimento" 
				value={birthDate} 
				selectionColor="#18122b"
				onChangeText={formatBirthDate} 
				keyboardType="numeric" 
			/>
			<TextBox placeholder="Email" selectionColor="#18122b" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
			<TextBox placeholder="Senha" selectionColor="#18122b" value={password} onChangeText={setPassword} secureTextEntry />
			<Text style={styles.passwordRequirements}>
				• Pelo menos 8 caracteres{'\n'}
				• Letras maiúsculas e minúsculas{'\n'}
				• Pelo menos 1 número{'\n'}
				• Pelo menos 1 caractere especial (@$!%*?&)
			</Text>

			<IconButton 
				image={require('@/assets/images/pink_button.png')} 
				text="Criar Conta" 
				onPress={handleSignup} 
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: Math.round(8 * scaleFactor),
		justifyContent: 'center',
		backgroundColor: '#e9ecf5'
	},
	backButton: {
		position: 'absolute',
		top: Math.round(8 * scaleFactor),
		left: Math.round(8 * scaleFactor),
	},
	title: {
		fontFamily: 'Tiny5',
		fontSize: Math.round(8 * scaleFactor),
		textAlign: 'center',
		marginBottom: Math.round(4 * scaleFactor),
	},
	input: {
		marginBottom: Math.round(4 * scaleFactor),
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(6 * scaleFactor),
	},
	passwordRequirements: {
		fontSize: Math.round(12 * scaleFactor),
		color: '#18122B',
		marginBottom: Math.round(6 * scaleFactor),
		fontFamily: 'TinyUnicode',
		lineHeight: Math.round(8 * scaleFactor),
		textAlign: 'left',
	},
});
