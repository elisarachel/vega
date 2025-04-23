import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateEmail } from 'firebase/auth';
import { auth } from '@/services/firebaseConfig';
import { User } from 'firebase/auth';
import { router } from 'expo-router';
import TextBox from '@/components/TextBox';
import IconButton from '@/components/Button';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebaseConfig';
import { Canvas, Image, useImage } from '@shopify/react-native-skia';
import Header from '@/components/Header';

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;

export default function ProfileScreen() {
	const [user, setUser] = useState<User | null>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [name, setName] = useState('');
	const [birthdate, setBirthdate] = useState('');
	const [newName, setNewName] = useState(user?.displayName || '');
	const [newEmail, setNewEmail] = useState(user?.email || '');
	const [newPassword, setNewPassword] = useState('');
	const [newBirthdate, setNewBirthdate] = useState('');
	const [isEditingName, setIsEditingName] = useState(false);
	const [isEditingEmail, setIsEditingEmail] = useState(false);
	const [isEditingBirthdate, setIsEditingBirthdate] = useState(false);
	const editIcon = useImage(require('@/assets/images/edit_icon.png'));
	const checkIcon = useImage(require('@/assets/images/check_icon.png'));
	const cancelIcon = useImage(require('@/assets/images/x_edit.png'));
	const arrowIcon = useImage(require('@/assets/images/front_arrow.png'));
	const favoritesIcon = useImage(require('@/assets/images/favorite_icon.png'));
	const notesIcon = useImage(require('@/assets/images/notes_icon.png'));

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			setUser(currentUser);

			if (currentUser) {
				// Busca os dados do Firestore
				const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
				if (userDoc.exists()) {
					const userData = userDoc.data();
					setBirthdate(userData.birthdate || ''); // Atualiza o estado com a data de nascimento
				}
			}
		});
		return () => unsubscribe();
	}, []);

	const formatBirthDate = (text: string) => {
		// Remove caracteres não numéricos
		const cleaned = text.replace(/\D/g, '');

		// Formata como DD/MM/AAAA
		return cleaned
			.replace(/^(\d{2})(\d)/, '$1/$2')
			.replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
			.slice(0, 10);
	};

	const handleLogin = async () => {
		try {
			await signInWithEmailAndPassword(auth, email, password);
		} catch (error: any) {
			Alert.alert('Erro ao entrar', error.message);
		}
	};

	const handleRegister = async () => {
		try {
			router.push('/(modals)/signup');
		}
		catch (error: any) {
			Alert.alert('Erro ao criar conta', error.message);
		}
	};

	const handleLogout = async () => {
		await signOut(auth);
	};

	const handleUpdateProfile = async () => {
		if (user) {
			await updateProfile(user, { displayName: 'Novo Nome' });
		}
	};

	const handleSaveName = async () => {
		if (user) {
			try {
				// Atualiza o nome no Firebase Authentication
				await updateProfile(user, { displayName: newName });

				// Atualiza o estado local
				setIsEditingName(false);
			} catch (error: any) {
				Alert.alert('Erro ao salvar nome', error.message);
			}
		}
	};

	const handleSaveEmail = async () => {
		if (user) {
			try {
				// Atualiza o email no Firebase Authentication
				await updateEmail(user, newEmail);

				// Atualiza o estado local
				setNewEmail(newEmail);
				setIsEditingEmail(false);
			} catch (error: any) {
				Alert.alert('Erro ao salvar email', error.message);
			}
		}
	};

	const handleSaveBirthdate = async () => {
		if (user) {
			try {
				// Atualiza a data de nascimento no Firestore
				const userDocRef = doc(db, 'users', user.uid);
				await updateDoc(userDocRef, { birthdate: newBirthdate });

				// Atualiza o estado local
				setBirthdate(newBirthdate);
				setNewBirthdate(''); // Limpa o campo de edição
				setIsEditingBirthdate(false);
			} catch (error: any) {
				Alert.alert('Erro ao salvar data de nascimento', error.message);
			}
		}
	};

	const handleCancelEditName = () => {
		setNewName(user?.displayName || '');
		setIsEditingName(false);
	};

	const handleCancelEditEmail = () => {
		setNewEmail(user?.email || '');
		setIsEditingEmail(false);
	};

	const handleCancelEditBirthdate = () => {
		setNewBirthdate('');
		setIsEditingBirthdate(false);
	};

	if (user) {
		return (
			<View style={styles.container}>
				<Header
					background={require('@/assets/images/header.png')}
					city={`Olá, ${user.displayName || 'Usuário'}`}
					pinIcon={require('@/assets/images/user_icon.png')}
				/>
				<View style={styles.container2} />
					<Text style={styles.title}>SEU PERFIL</Text>
					<View style={styles.row}>
						{isEditingEmail ? (
							<TextBox
								placeholder="Email"
								value={newEmail || user.email || ''}
								onChangeText={setNewEmail}
								autoCapitalize="none"
								selectionColor="#18122b"
								type="edit"
							/>
						) : (
							<Text style={[styles.text, { textAlign: 'left'}]}>
								Email: {user.email}
							</Text>
						)}
						<TouchableOpacity onPress={() => (isEditingEmail ? handleSaveEmail() : setIsEditingEmail(true))}>
							<Canvas style={styles.icon}>
								<Image
									image={
										isEditingEmail
											? checkIcon
											: editIcon
									}
									x={0}
									y={0}
									width={isEditingEmail ? Math.round(16 * scaleFactor) : Math.round(12 * scaleFactor)} // Edit icon is smaller
									height={isEditingEmail ? Math.round(16 * scaleFactor) : Math.round(12 * scaleFactor)} // Edit icon is smaller
								/>
							</Canvas>
						</TouchableOpacity>
						{isEditingEmail && (
							<TouchableOpacity onPress={handleCancelEditEmail}>
								<Canvas style={styles.icon}>
									<Image
										image={cancelIcon}
										x={0}
										y={0}
										width={Math.round(16 * scaleFactor)}
										height={Math.round(16 * scaleFactor)}
									/>
								</Canvas>
							</TouchableOpacity>
						)}
					</View>
					<View style={styles.row}>
						{isEditingName ? (
							<TextBox
								placeholder="Nome"
								value={newName}
								onChangeText={(text) => setNewName(text)} 
								selectionColor="#18122b"
								type="edit"
							/>
						) : (
							<Text style={[styles.text, { textAlign: 'left' }]}>
								Nome: {user.displayName || '-'}
							</Text>
						)}
						<TouchableOpacity onPress={() => (isEditingName ? handleSaveName() : setIsEditingName(true))}>
							<Canvas style={styles.icon}>
								<Image
									image={isEditingName ? checkIcon : editIcon}
									x={0}
									y={0}
									width={isEditingName ? Math.round(16 * scaleFactor) : Math.round(12 * scaleFactor)} // Edit icon is smaller
									height={isEditingName ? Math.round(16 * scaleFactor) : Math.round(12 * scaleFactor)} // Edit icon is smaller
								/>
							</Canvas>
						</TouchableOpacity>
						{isEditingName && (
							<TouchableOpacity onPress={handleCancelEditName}>
								<Canvas style={styles.icon}>
									<Image
										image={cancelIcon}
										x={0}
										y={0}
										width={Math.round(16 * scaleFactor)}
										height={Math.round(16 * scaleFactor)}
									/>
								</Canvas>
							</TouchableOpacity>
						)}
					</View>
					<View style={styles.row}>
						{isEditingBirthdate ? (
							<TextBox
								placeholder="Data de Nascimento"
								value={newBirthdate || birthdate}
								onChangeText={(text) => setNewBirthdate(formatBirthDate(text))} 
								selectionColor="#18122b"
								type="edit"
							/>
						) : (
							<Text
								style={[
									styles.text,
									{ textAlign: 'left', left: Math.round(scaleFactor), marginBottom: Math.round(5 * scaleFactor) },
								]}
							>
								Data de Nascimento: {birthdate || '-'}
							</Text>
						)}
						<TouchableOpacity
							onPress={() => (isEditingBirthdate ? handleSaveBirthdate() : setIsEditingBirthdate(true))}
						>
							<Canvas style={styles.icon}>
								<Image
									image={isEditingBirthdate ? checkIcon : editIcon}
									x={0}
									y={0}
									width={isEditingBirthdate ? Math.round(16 * scaleFactor) : Math.round(12 * scaleFactor)} // Edit icon is smaller
									height={isEditingBirthdate ? Math.round(16 * scaleFactor) : Math.round(12 * scaleFactor)} // Edit icon is smaller
								/>
							</Canvas>
						</TouchableOpacity>
						{isEditingBirthdate && (
							<TouchableOpacity onPress={handleCancelEditBirthdate}>
								<Canvas style={styles.icon}>
									<Image
										image={cancelIcon}
										x={0}
										y={0}
										width={Math.round(16 * scaleFactor)}
										height={Math.round(16 * scaleFactor)}
									/>
								</Canvas>
							</TouchableOpacity>
						)}
					</View>
					<View style={styles.horizontalLine} />
					<TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(modals)/favorites')}>
						<View style={styles.inlineRow}>
							<Text style={styles.linkText}>Meus Favoritos</Text>
							<Canvas style={styles.rightIcon}>
								<Image
									image={favoritesIcon}
									x={0}
									y={Math.round(2 * scaleFactor)}
									width={Math.round(16 * scaleFactor)}
									height={Math.round(16 * scaleFactor)}
								/>
							</Canvas>
							<Canvas style={styles.inlineIcon}>
								<Image
									image={arrowIcon}
									x={0}
									y={Math.round(5 * scaleFactor)}
									width={Math.round(10 * scaleFactor)}
									height={Math.round(10 * scaleFactor)}
								/>
							</Canvas>
						</View>
					</TouchableOpacity>
					<TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(modals)/notes')}>
						<View style={styles.inlineRow}>
							<Text style={styles.linkText}>Meu Diário</Text>
							<Canvas style={styles.rightIcon}>
								<Image
									image={notesIcon}
									x={0}
									y={Math.round(2 * scaleFactor)}
									width={Math.round(16 * scaleFactor)}
									height={Math.round(16 * scaleFactor)}
								/>
							</Canvas>
							<Canvas style={styles.inlineIcon}>
								<Image
									image={arrowIcon}
									x={0}
									y={Math.round(5 * scaleFactor)}
									width={Math.round(10 * scaleFactor)}
									height={Math.round(10 * scaleFactor)}
								/>
							</Canvas>
						</View>
					</TouchableOpacity>
					<TouchableOpacity style={styles.linkRow} onPress={handleLogout}>
						<View style={styles.inlineRow}>
							<Text style={styles.linkText}>Sair</Text>
							<Canvas style={styles.inlineIcon}>
								<Image
									image={arrowIcon}
									x={0}
									y={Math.round(5 * scaleFactor)}
									width={Math.round(10 * scaleFactor)}
									height={Math.round(10 * scaleFactor)}
								/>
							</Canvas>
						</View>
					</TouchableOpacity>
				</View>
		);
	}
	

	return (
		<View style={styles.container}>
			<Header
				background={require('@/assets/images/header.png')}
				city="Bem-vindo"
				pinIcon={require('@/assets/images/user_icon.png')}
			/>
			<Text style={styles.title}>LOGIN</Text>
			<View style={styles.login}>
			<TextBox
				placeholder="Email"
				value={email}
				onChangeText={setEmail}
				autoCapitalize="none"
				selectionColor="#18122b"
			/>
			<TextBox
				placeholder="Senha"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
				selectionColor="#18122b"
			/>
			<IconButton 
				image={require('@/assets/images/pink_button.png')} 
				text="Entrar" 
				onPress={handleLogin} 
			/>
			</View>
			<View/>
			<TouchableOpacity onPress={handleRegister}>
				<Text style={styles.registerText}>
					Ou <Text style={styles.underline}>criar conta</Text>
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'flex-start', // Ensure content starts below the header
		backgroundColor: '#e9ecf5',
		position: 'relative',
	},
	container2: {
		//flex: 1,
		marginLeft: Math.round(16 * scaleFactor),
	},
	title: {
		fontFamily: 'Tiny5',
		fontSize: Math.round(10 * scaleFactor),
		textAlign: 'left',
		marginBottom: Math.round(4 * scaleFactor),
		marginLeft: Math.round(8 * scaleFactor),
		color: '#18122B',
	},
	text: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(13 * scaleFactor),
		marginBottom: Math.round(4 * scaleFactor),
		//marginLeft: Math.round(8 * scaleFactor),
		textAlign: 'center',
		color: '#18122B',
	},
	registerText: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(12 * scaleFactor),
		textAlign: 'center',
		color: '#18122B',
	},
	underline: {
		fontFamily: 'Tiny5',
		fontSize: Math.round(6 * scaleFactor),
		textDecorationLine: 'underline',
	},
	buttonSpacing: {
		marginBottom: Math.round(4 * scaleFactor),
		marginLeft: Math.round(8 * scaleFactor),
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: Math.round(4 * scaleFactor),
		marginRight: Math.round(4 * scaleFactor),
		marginLeft: Math.round(8 * scaleFactor),
	},
	icon: {
		width: Math.round(16 * scaleFactor),
		height: Math.round(16 * scaleFactor),
		marginLeft: Math.round(2 * scaleFactor),
	},
	horizontalLine: {
		borderBottomWidth: Math.round(1 * scaleFactor),
		borderBottomColor: '#18122B',
		marginVertical: Math.round(4 * scaleFactor),
		marginHorizontal: Math.round(8 * scaleFactor),
	},
	linkRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: Math.round(2 * scaleFactor),
		paddingHorizontal: Math.round(8 * scaleFactor),
	},
	linkText: {
		fontFamily: 'TinyUnicode',
		fontSize: Math.round(13 * scaleFactor),
		color: '#18122B',
	},
	arrowIcon: {
		width: Math.round(16 * scaleFactor),
		height: Math.round(16 * scaleFactor),
	},
	inlineRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	inlineIcon: {
		marginLeft: Math.round(2 * scaleFactor),
		width: Math.round(16 * scaleFactor),
		height: Math.round(16 * scaleFactor),
	},
	rightIcon: {
		marginLeft: Math.round(4 * scaleFactor),
		width: Math.round(16 * scaleFactor),
		height: Math.round(16 * scaleFactor),
	},
	login: {
		marginLeft: Math.round(8 * scaleFactor),

	}
});
