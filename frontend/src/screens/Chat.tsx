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
import { AnimatedMessage, BreathingBlock } from '../components/MotionHelpers';

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

    // Inside renderItem (restored):
    const renderItem = ({ item }: { item: ChatMessage }) => {
        // 🔒 SMART ALIGNMENT: 
        // If IDs match (Self-Chat Demo), use Role to distinguish.
        let isMe = item.sender_id === userInfo?.id;

        if (isMe && item.role && userInfo?.role) {
            // Refine using role if available
            isMe = item.role === userInfo.role;
        }

        return (
            <AnimatedMessage isMe={isMe} style={[styles.msgRow, isMe ? styles.rowRight : styles.rowLeft]}>
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
                    {item.timestamp && (
                        <Text style={[styles.time, isMe ? styles.timeMe : styles.timeThem]}>
                            {new Date(item.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                    )}
                </View>
            </AnimatedMessage>
        );
    };

    // ...

    // Inside FlatList:
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <IconArrowLeft size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{name}</Text>
                    <View style={{ width: 24 }} /> {/* Spacer for balance */}
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
                        ListEmptyComponent={
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
                                <BreathingBlock>
                                    <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
                                </BreathingBlock>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 }}>
                                    Start the conversation
                                </Text>
                                <Text style={{ color: '#64748b' }}>
                                    Say hello to {name}
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* INPUT */}
                <View style={styles.inputBar}>
                    <TouchableOpacity style={styles.attachBtn}>
                        <IconPlus size={24} color="#64748b" />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Message..."
                        placeholderTextColor="#94a3b8"
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
                        <IconSend size={20} color="white" />
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
    container: { flex: 1, backgroundColor: '#ffffff' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: 'white'
    },
    backBtn: {
        padding: 8,
        marginLeft: -8
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0f172a'
    },

    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    list: { padding: 16, paddingBottom: 24 },

    msgRow: { flexDirection: 'row', marginBottom: 20, maxWidth: '80%' },
    rowLeft: { alignSelf: 'flex-start' },
    rowRight: { alignSelf: 'flex-end', justifyContent: 'flex-end' },

    avatar: {
        width: 32,
        height: 32,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: '#f1f5f9'
    },

    bubble: { padding: 14, borderRadius: 20 },
    bubbleMe: {
        backgroundColor: '#7c3aed', // Violet-600
        borderBottomRightRadius: 4
    },
    bubbleThem: {
        backgroundColor: '#f1f5f9', // Slate-100 (No border, clean)
        borderBottomLeftRadius: 4
    },

    text: { fontSize: 16, lineHeight: 24 },
    textMe: { color: 'white' },
    textThem: { color: '#0f172a' },

    time: { fontSize: 11, marginTop: 6 },
    timeMe: { color: 'rgba(255,255,255,0.7)' },
    timeThem: { color: '#94a3b8' },

    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: 30, // iOS Home Indicator safe
        borderTopWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: 'white'
    },
    attachBtn: {
        padding: 10,
    },
    input: {
        flex: 1,
        marginHorizontal: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 12,
        fontSize: 16,
        color: '#0f172a',
        maxHeight: 100
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#7c3aed',
        alignItems: 'center',
        justifyContent: 'center'
    },
    sendDisabled: {
        backgroundColor: '#f1f5f9'
    }
});
