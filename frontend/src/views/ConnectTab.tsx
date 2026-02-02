import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChatAPI } from '../services/api';
import { User, UserRole } from '../types';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface ConnectTabProps {
    currentUser: User;
}

interface ChatPreview {
    id: string;
    _id: string;
    user_id: string;
    employer_id: string;
    job_id: string;
    last_message?: string;
    updated_at?: string;
    // In a real app, we'd expand 'job_snapshot' or fetch names. 
    // For MVP, we derive "Role" from ID comparison.
}

// =============================================================================
// UTILITIES
// =============================================================================

const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // Today: Show time (e.g., "10:30 AM")
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ConnectTab({ currentUser }: ConnectTabProps) {
    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<any>(); // Typing depends on your Nav stack

    // Operational Discipline: Centralized fetcher
    const fetchChats = async () => {
        try {
            const data = await ChatAPI.getChats();
            // Backend guarantees a list, but we defend against nulls
            if (Array.isArray(data)) {
                setChats(data);
            } else if (data && data.chats) {
                // Handle legacy wrapper if exists
                setChats(data.chats);
            }
        } catch (e) {
            console.error("Failed to load chats", e);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchChats();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchChats();
    };

    const handleOpenChat = (chat: ChatPreview) => {
        // Navigation Logic: Pass ID and context
        // Matches App.tsx 'Chat' route
        navigation.navigate('Chat', { chatId: chat.id || chat._id });
    };

    // =========================================================================
    // RENDER HELPERS
    // =========================================================================

    const renderItem = ({ item }: { item: ChatPreview }) => {
        // Dynamic Role Logic
        const isEmployer = currentUser?.role === UserRole.EMPLOYER;
        const displayName = isEmployer ? "Candidate" : "Hiring Manager";
        const displayRole = isEmployer ? "Applicant for Job" : "Company Rep";

        // Visual indicator for "System" or real people
        const avatarColor = isEmployer ? '#E0F2FE' : '#F3E8FF'; // Blue for candidates, Purple for companies
        const avatarEmoji = isEmployer ? '👨‍💻' : '💼';

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => handleOpenChat(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.avatarContainer, { backgroundColor: avatarColor }]}>
                    <Text style={styles.avatarText}>{avatarEmoji}</Text>
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.topRow}>
                        <Text style={styles.name}>{displayName}</Text>
                        <Text style={styles.time}>{formatTime(item.updated_at)}</Text>
                    </View>

                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.last_message || "Start the conversation..."}
                    </Text>

                    <View style={styles.metaRow}>
                        <Text style={styles.jobRef}>Ref: {item.job_id.slice(-6).toUpperCase()}</Text>
                        <Text style={styles.roleLabel}>{displayRole}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No connections yet</Text>
            <Text style={styles.emptyDesc}>
                {currentUser?.role === UserRole.EMPLOYEE
                    ? "Apply to jobs to start conversations with employers."
                    : "Wait for candidates to apply to your posted jobs."}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Your Connections</Text>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
            ) : (
                <FlatList
                    data={chats}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id || item._id}
                    contentContainerStyle={[
                        styles.listContent,
                        chats.length === 0 && styles.centerEmpty
                    ]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
                    }
                    ListEmptyComponent={renderEmpty}
                />
            )}
        </View>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    headerContainer: { backgroundColor: 'white', padding: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
    header: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },

    listContent: { padding: 16 },
    centerEmpty: { flex: 1, justifyContent: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    card: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
        borderWidth: 1, borderColor: '#f1f5f9'
    },

    avatarContainer: {
        width: 50, height: 50,
        borderRadius: 25,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 16
    },
    avatarText: { fontSize: 24 },

    infoContainer: { flex: 1 },

    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    time: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

    lastMessage: { fontSize: 14, color: '#64748b', marginBottom: 8 },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    jobRef: { fontSize: 10, color: '#94a3b8', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    roleLabel: { fontSize: 10, color: '#cbd5e1' },

    emptyState: { alignItems: 'center', padding: 32 },
    emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.5 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
    emptyDesc: { textAlign: 'center', color: '#64748b', fontSize: 14, lineHeight: 22 }
});