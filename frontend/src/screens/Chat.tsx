// ChatScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Image,
    SafeAreaView,
    Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ChatAPI } from '../services/api';
import {
    IconArrowLeft,
    IconSend,
    IconPlus,
    IconVideo,
    IconPhone
} from '../components/Icons';

// =============================================================================
// TYPES — MUST MATCH BACKEND EXACTLY
// =============================================================================

// Local interface because backend returns snake_case 'sender_id'
// which differs from the camelCase 'senderId' in src/types.ts
interface ChatMessage {
    id?: string;
    sender_id: string;
    role?: string; // 🔒 New field for alignment
    text: string;
    timestamp: string;
}

interface ChatRouteParams {
    chatId: string;
    name?: string;
}

interface ChatScreenProps {
    navigation: any;
    route: {
        params: ChatRouteParams;
    };
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ChatScreen({ navigation, route }: ChatScreenProps) {
    const { userInfo } = useAuth();
    const { chatId, name = 'Chat' } = route.params || {};

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    // =========================================================================
    // LOAD CHAT — BACKEND IS SOURCE OF TRUTH
    // =========================================================================

    useEffect(() => {
        if (!chatId) {
            Alert.alert('Error', 'Chat not available.');
            navigation.goBack();
            return;
        }

        loadChat();
    }, [chatId]);

    const loadChat = async () => {
        try {
            const data = await ChatAPI.getMessages(chatId);
            setMessages(Array.isArray(data?.messages) ? data.messages : []);
        } catch (e) {
            console.error('❌ Failed to load chat:', e);
            Alert.alert('Error', 'Unable to load chat.');
        } finally {
            setLoading(false);
            requestAnimationFrame(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            });
        }
    };

    // =========================================================================
    // SEND MESSAGE — NO OPTIMISTIC UI (ZERO SPLIT-BRAIN)
    // =========================================================================

    const sendMessage = async () => {
        const text = inputText.trim();
        if (!text || sending) return;

        setSending(true);
        setInputText('');

        try {
            await ChatAPI.sendMessage(chatId, text, userInfo?.role);
            await loadChat(); // 🔒 backend is single source of truth
        } catch (e) {
            console.error('❌ Send failed:', e);
            Alert.alert('Error', 'Message failed to send.');
        } finally {
            setSending(false);
        }
    };

    // =========================================================================
    // RENDER MESSAGE
    // =========================================================================

    const renderItem = ({ item }: { item: ChatMessage }) => {
        // 🔒 SMART ALIGNMENT: 
        // If IDs match (Self-Chat Demo), use Role to distinguish.
        let isMe = item.sender_id === userInfo?.id;

        if (isMe && item.role && userInfo?.role) {
            // Refine using role if available
            isMe = item.role === userInfo.role;
        }

        return (
            <View style={[styles.msgRow, isMe ? styles.rowRight : styles.rowLeft]}>
                {!isMe && (
                    <Image
                        source={{ uri: `https://ui-avatars.com/api/?name=${name}` }}
                        style={styles.avatar}
                    />
                )}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    <Text style={[styles.text, isMe ? styles.textMe : styles.textThem]}>
                        {item.text}
                    </Text>
                    <Text style={styles.time}>
                        {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>
            </View>
        );
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <IconArrowLeft size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{name}</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <IconPhone size={20} color="#94a3b8" />
                        <IconVideo size={20} color="#94a3b8" />
                    </View>
                </View>

                {/* MESSAGES */}
                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color="#7c3aed" />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => item.timestamp || Math.random().toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        onContentSizeChange={() =>
                            flatListRef.current?.scrollToEnd({ animated: true })
                        }
                    />
                )}

                {/* INPUT */}
                <View style={styles.inputBar}>
                    <TouchableOpacity>
                        <IconPlus size={22} color="#94a3b8" />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message…"
                        multiline
                    />

                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            (!inputText.trim() || sending) && styles.sendDisabled
                        ]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || sending}
                    >
                        <IconSend size={18} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9'
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a'
    },

    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    list: { padding: 16 },

    msgRow: { flexDirection: 'row', marginBottom: 12, maxWidth: '85%' },
    rowLeft: { alignSelf: 'flex-start' },
    rowRight: { alignSelf: 'flex-end' },

    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8
    },

    bubble: { padding: 12, borderRadius: 16 },
    bubbleMe: { backgroundColor: '#7c3aed', borderBottomRightRadius: 2 },
    bubbleThem: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 2,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },

    text: { fontSize: 15 },
    textMe: { color: 'white' },
    textThem: { color: '#0f172a' },

    time: { fontSize: 10, marginTop: 4, color: '#94a3b8' },

    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        borderTopWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: 'white'
    },
    input: {
        flex: 1,
        marginHorizontal: 8,
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#7c3aed',
        alignItems: 'center',
        justifyContent: 'center'
    },
    sendDisabled: {
        backgroundColor: '#cbd5e1'
    }
});
