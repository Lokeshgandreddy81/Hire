import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../services/api';

export default function ChatScreen({ navigation, route }) {
    const { chatId } = route.params;
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef(null);

    useEffect(() => {
        loadChat();
        // In production, set up WebSocket connection here
    }, []);

    const loadChat = async () => {
        try {
            const response = await api.get(`/chats/${chatId}`);
            setMessages(response.data.messages || []);
        } catch (e) {
            console.error('Failed to load chat:', e);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        const text = inputText.trim();
        if (!text) return;

        const newMessage = {
            sender: 'user',
            text,
            timestamp: new Date().toISOString()
        };
        setMessages([...messages, newMessage]);
        setInputText('');

        try {
            await api.post(`/chats/${chatId}/messages`, { text });
        } catch (e) {
            console.error('Failed to send message:', e);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chat</Text>
                <View style={{ width: 50 }} />
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={[
                        styles.messageContainer,
                        item.sender === 'user' ? styles.userMessage : styles.employerMessage
                    ]}>
                        <Text style={styles.messageText}>{item.text}</Text>
                        <Text style={styles.timestamp}>
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                )}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type a message..."
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
    },
    backButton: {
        fontSize: 18,
        color: '#7B2CBF',
        fontWeight: '600'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333'
    },
    messagesList: {
        padding: 20
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12
    },
    userMessage: {
        backgroundColor: '#7B2CBF',
        alignSelf: 'flex-end'
    },
    employerMessage: {
        backgroundColor: '#E0E0E0',
        alignSelf: 'flex-start'
    },
    messageText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        alignSelf: 'flex-end'
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        alignItems: 'flex-end'
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginRight: 10,
        maxHeight: 100
    },
    sendButton: {
        backgroundColor: '#7B2CBF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    }
});
