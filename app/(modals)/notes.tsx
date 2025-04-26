import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Canvas, Image as SkiaImage, useImage } from '@shopify/react-native-skia';
import PageHeader from '@/components/PageHeader';
import IconButton from '@/components/Button';
import { Swipeable } from 'react-native-gesture-handler';
import PixelLoader from '@/components/LoadingAnimation';
import { DateTime } from 'luxon';

const ORIGINAL_WIDTH = 144;
const scaleFactor = Dimensions.get('window').width / ORIGINAL_WIDTH;

const truncateText = (text: string, maxLength: number) => {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength - 3) + '...';
};

export default function DiarioHome() {
    type Note = {
        id: string;
        data?: string;
        texto?: string;
        faseDaLua?: string;
        condicaoObservacao?: string;
		astrosSelecionados?: [];
		astrosVisiveis?: [];
    };

    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoadingNotes, setIsLoadingNotes] = useState(true);
    const router = useRouter();
    const db = getFirestore();
    const user = getAuth().currentUser;

    const noteFrameImage = useImage(require('@/assets/images/note_frame.png'));
	const deleteIcon = useImage(require('@/assets/images/delete_icon.png'))
	const editIcon = useImage(require('@/assets/images/edit_icon.png'))

    // Pré-carregar todas as imagens de fase da lua e clima
    const moonPhaseImagesLoaded = {
        'Lua Nova': useImage(require('@/assets/images/nova.png')),
        'Lua Crescente': useImage(require('@/assets/images/crescente.png')),
        'Lua Cheia': useImage(require('@/assets/images/cheia.png')),
        'Lua Minguante': useImage(require('@/assets/images/minguante.png')),
    };

    const weatherIconsLoaded = {
        'Céu limpo': useImage(require('@/assets/images/ceulimpo.png')),
        'Parcialmente nublado': useImage(require('@/assets/images/parcialmentenublado.png')),
        'Nublado': useImage(require('@/assets/images/nublado.png')),
        'Chuva': useImage(require('@/assets/images/chuvoso.png')),
        'Neve': useImage(require('@/assets/images/neve.png')),
        'Tempestade': useImage(require('@/assets/images/tempestade.png')),
        'Desconhecido': useImage(require('@/assets/images/parcialmentenublado.png')),
    };

    useEffect(() => {
        if (user) {
            const fetchNotes = async () => {
                setIsLoadingNotes(true);
                try {
                    const notesQuery = query(
                        collection(db, 'notas'),
                        where('userId', '==', user.uid)
                    );
                    const snapshot = await getDocs(notesQuery);
                    const data = snapshot.docs.map(doc => {
                        const noteData = doc.data();
                        let formattedDate = null;

                        // Converte a data ISO para dd/MM/yyyy
                        if (noteData.data) {
                            const luxonDate = DateTime.fromISO(noteData.data, { zone: 'utc' });
                            if (luxonDate.isValid) {
                                formattedDate = luxonDate.toFormat('dd/MM/yyyy');
                            }
                        }

                        return {
                            id: doc.id,
                            ...noteData,
							data: formattedDate || undefined, // Salva a data formatada
                            astrosVisiveis: noteData.astrosVisiveis || [],
                        };
                    });
                    setNotes(data);
                } catch (error) {
                    console.error("Erro ao buscar notas:", error); 
                } finally {
                    setIsLoadingNotes(false);
                }
            };
            fetchNotes();
        }
    }, [user]);

	const handleEdit = (noteId: string) => {
		const noteToEdit = notes.find((note) => note.id === noteId);
		if (noteToEdit) {
			router.push({
				pathname: '/(modals)/note/[note]',
				params: { 
					note: noteId,
					data: noteToEdit.data,
					texto: noteToEdit.texto,
					faseDaLua: noteToEdit.faseDaLua,
					condicaoObservacao: noteToEdit.condicaoObservacao,
					astrosSelecionados: noteToEdit.astrosSelecionados || [],
					astrosVisiveis: noteToEdit.astrosVisiveis || [],
				},
			});
		}
	};

	const handleDelete = async (noteId: string) => {
		Alert.alert('Confirmar', 'Deseja deletar esta nota?', [
			{ text: 'Cancelar', style: 'cancel' },
			{
				text: 'Deletar',
				style: 'destructive',
				onPress: async () => {
					await deleteDoc(doc(db, 'notas', noteId));
					setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
				},
			},
		]);
	};

	const handleViewNote = (noteId: string) => {
		router.push({
			pathname: '/(modals)/note/view/[id]',
			params: { id: noteId },
		});
	};

	const renderRightActions = (noteId: string) => (
		<View style={styles.actionsContainer}>
			<TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(noteId)}>
				<Canvas style={styles.actionIcon}>
					{editIcon && (
						<SkiaImage
							image={editIcon}
							x={0}
							y={0}
							width={styles.actionIcon.width}
							height={styles.actionIcon.height}
						/>
					)}
				</Canvas>
			</TouchableOpacity>
			<TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(noteId)}>
				<Canvas style={styles.actionIcon}>
					{deleteIcon && (
						<SkiaImage
							image={deleteIcon}
							x={0}
							y={0}
							width={styles.actionIcon.width}
							height={styles.actionIcon.height}
						/>
					)}
				</Canvas>
			</TouchableOpacity>
		</View>
	);

    return (
        <View style={styles.container}>
            <PageHeader
                background={require('@/assets/images/header2_pink.png')}
                icon={require('@/assets/images/notes_icon.png')}
                text="Diário de observação"
            />

            {isLoadingNotes ? (
				<View style={styles.loadingContainer}>
					<PixelLoader />
				</View>
			) : (
				<FlatList
					data={notes}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<Swipeable renderRightActions={() => renderRightActions(item.id)}>
							<TouchableOpacity onPress={() => handleViewNote(item.id)}>
								<View style={styles.noteCard}>
									{noteFrameImage && (
										<Canvas style={styles.noteCardCanvas}>
											<SkiaImage
												image={noteFrameImage}
												x={0}
												y={0}
												width={styles.noteCardCanvas.width}
												height={styles.noteCardCanvas.height}
											/>
										</Canvas>
									)}
									<View style={styles.noteCardContent}>
										<View style={styles.textContainer}>
											<Text style={styles.noteDate}>
												{item.data || 'Data inválida'}
											</Text>
											<Text style={styles.notePreview}>
												{truncateText(item.texto || '', 53)}
											</Text>
										</View>
										<View style={styles.iconsContainer}>
											{item.faseDaLua && moonPhaseImagesLoaded[item.faseDaLua as keyof typeof moonPhaseImagesLoaded] && (
												<Canvas style={styles.icon}>
													<SkiaImage
														image={moonPhaseImagesLoaded[item.faseDaLua as keyof typeof moonPhaseImagesLoaded]}
														x={0}
														y={0}
														width={styles.icon.width}
														height={styles.icon.height}
													/>
												</Canvas>
											)}
											{item.condicaoObservacao && weatherIconsLoaded[item.condicaoObservacao as keyof typeof weatherIconsLoaded] && (
												<Canvas style={styles.icon}>
													<SkiaImage
														image={weatherIconsLoaded[item.condicaoObservacao as keyof typeof weatherIconsLoaded]}
														x={0}
														y={0}
														width={styles.icon.width}
														height={styles.icon.height}
													/>
												</Canvas>
											)}
										</View>
									</View>
								</View>
							</TouchableOpacity>
						</Swipeable>
					)}
				/>
			)}

            <View style={styles.newNoteButton}>
                <IconButton
                    image={require('@/assets/images/pink_button.png')}
                    text="Nova Nota +"
                    onPress={() => router.push('/(modals)/note/nova')}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E9ECF5',
        alignItems: 'center'
    },
    noteCard: {
		marginTop: Math.round(8*scaleFactor),
        position: 'relative',
		width: Math.round(128*scaleFactor),
        height: Math.round(39*scaleFactor),
    },
    noteCardCanvas: {
        position: 'absolute',
        width: Math.round(128*scaleFactor),
        height: Math.round(39*scaleFactor),
    },
    noteCardContent: {
        position: 'relative',
        padding: Math.round(8 * scaleFactor),
        width: '100%',
        height: Math.round(39*scaleFactor),
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
    },
    noteDate: {
        fontSize: Math.round(10 * scaleFactor),
        color: '#7A7D8D',
        fontFamily: 'TinyUnicode',
		marginTop: -Math.round(4 * scaleFactor),
    },
    notePreview: {
        fontSize: Math.round(12 * scaleFactor),
        color: '#18122B',
        fontFamily: 'TinyUnicode',
    },
    iconsContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        width: Math.round(16 * scaleFactor),
        height: Math.round(16 * scaleFactor),
    },
	actionsContainer: {
		top: Math.round(4 * scaleFactor),
		flexDirection: 'column',
		gap: Math.round(2 * scaleFactor),
		alignItems: 'center',
		justifyContent: 'center',
	},
	actionButton: {
		width: Math.round(16 * scaleFactor),
		height: Math.round(16 * scaleFactor),
		justifyContent: 'center',
		alignItems: 'center',
	},
	actionIcon: {
		width: Math.round(16 * scaleFactor),
		height: Math.round(16 * scaleFactor),
	},
    newNoteButton: {
        right: Math.round(14 * scaleFactor),
		marginBottom: Math.round(16 * scaleFactor),
    },
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
