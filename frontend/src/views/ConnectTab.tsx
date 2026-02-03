import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChatAPI } from '../services/api';
import { User, UserRole } from '../types';
import { AnimatedCard, BreathingBlock } from '../components/MotionHelpers';

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

    const renderItem = ({ item, index }: { item: ChatPreview, index: number }) => {
        // Dynamic Role Logic
        const isEmployer = currentUser?.role === UserRole.EMPLOYER;
        const displayName = isEmployer ? "Candidate" : "Hiring Manager";
        const displayRole = isEmployer ? "Applicant for Job" : "Company Rep";

        // Visual indicator for "System" or real people
        const avatarColor = isEmployer ? '#E0F2FE' : '#F3E8FF'; // Blue for candidates, Purple for companies
        const avatarEmoji = isEmployer ? '👨‍💻' : '💼';

        return (
            <AnimatedCard
                index={index}
                style={styles.card}
                onPress={() => handleOpenChat(item)}
            >
                <View style={[styles.avatarContainer, { backgroundColor: '#f1f5f9' }]}>
                    <Text style={styles.avatarText}>{avatarEmoji}</Text>
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.topRow}>
                        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
                        <Text style={styles.time}>{formatTime(item.updated_at)}</Text>
                    </View>

                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.last_message || "Start the conversation..."}
                    </Text>

                    <View style={styles.metaRow}>
                        <Text style={styles.jobRef}>Ref: {item.job_id.slice(-6).toUpperCase()}</Text>
                    </View>
                </View>
            </AnimatedCard>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <BreathingBlock>
                <Text style={styles.emptyIcon}>💬</Text>
            </BreathingBlock>
            <Text style={styles.emptyTitle}>Quiet here</Text>
            <Text style={styles.emptyDesc}>
                {currentUser?.role === UserRole.JOB_SEEKER
                    ? "Apply to jobs to start conversations."
                    : "No inquiries yet. They'll appear here."}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <Text style={styles.headerSubtitle}>Your active conversations</Text>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7c3aed" />
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
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
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

    // Header
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 4,
        fontWeight: '500',
    },

    listContent: { padding: 24 },
    centerEmpty: { flex: 1, justifyContent: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    card: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 12,
        alignItems: 'center',
        // Soft Light
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 1,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },

    avatarContainer: {
        width: 52, height: 52,
        borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 20,
        borderWidth: 1,
        borderColor: '#f8fafc'
    },
    avatarText: { fontSize: 24 },

    infoContainer: { flex: 1 },

    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    name: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 }, // Added flex:1 and margin
    time: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },

    lastMessage: { fontSize: 15, color: '#475569', marginBottom: 8, lineHeight: 22 }, // Better color & leading

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    jobRef: {
        fontSize: 12, // Increased from 11
        color: '#64748b',
        backgroundColor: '#f1f5f9', // Slightly darker bg
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
        fontWeight: '600',
        letterSpacing: 0.5
    },

    emptyState: { alignItems: 'center', padding: 32, paddingBottom: 100 },
    emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.8 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
    emptyDesc: { textAlign: 'center', color: '#64748b', fontSize: 16, lineHeight: 24 }
});