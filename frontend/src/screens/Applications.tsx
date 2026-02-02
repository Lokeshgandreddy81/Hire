import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ApplicationAPI } from '../services/api';
import { IconMessageSquare, IconFile, IconBriefcase } from '../components/Icons';

// =============================================================================
// CONSTANTS
// =============================================================================

const FILTER_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Requested', value: 'requested' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Rejected', value: 'rejected' }
];

const STATUS_COLORS: Record<string, string> = {
    requested: '#3b82f6',
    accepted: '#16a34a',
    rejected: '#94a3b8'
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function ApplicationsScreen({ navigation }: any) {
    const [applications, setApplications] = useState < any[] > ([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');

    // =========================================================================
    // LOAD APPLICATIONS (BACKEND = SINGLE SOURCE OF TRUTH)
    // =========================================================================

    const loadApplications = async () => {
        try {
            const data = await ApplicationAPI.getAll();

            if (!Array.isArray(data)) {
                setApplications([]);
                return;
            }

            /**
             * HARD GUARANTEES:
             * - id        -> application.id
             * - chat_id   -> backend chat_id ONLY
             * - status    -> backend enum
             */
            const normalized = data.map(app => ({
                id: app.id,
                status: app.status,
                chatId: app.chat_id ?? null,
                jobTitle: app.jobTitle ?? 'Job',
                companyName: app.companyName ?? 'Company',
                lastActivity: app.updatedAt ?? new Date().toISOString()
            }));

            setApplications(normalized);
        } catch (e) {
            console.error('Failed to load applications:', e);
            setApplications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadApplications();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadApplications();
    };

    // =========================================================================
    // FILTER
    // =========================================================================

    const filteredApps =
        filter === 'all'
            ? applications
            : applications.filter(app => app.status === filter);

    // =========================================================================
    // CHAT NAVIGATION (CRITICAL)
    // =========================================================================

    const handleOpenChat = (app: any) => {
        if (!app.chatId) {
            Alert.alert(
                'Chat Locked',
                'Chat will be available once the employer accepts your application.'
            );
            return;
        }

        navigation.navigate('Chat', {
            chatId: app.chatId,     // 🔒 EXACT KEY ChatScreen expects
            name: app.companyName
        });
    };

    // =========================================================================
    // RENDER ITEM
    // =========================================================================

    const renderItem = ({ item }: { item: any }) => {
        const statusColor = STATUS_COLORS[item.status] || '#64748b';
        const chatEnabled = Boolean(item.chatId);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                        <Text style={styles.jobTitle}>{item.jobTitle}</Text>
                        <Text style={styles.companyName}>{item.companyName}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.dateRow}>
                        <IconBriefcase size={14} color="#94a3b8" />
                        <Text style={styles.dateText}>
                            {new Date(item.lastActivity).toLocaleDateString()}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.chatButton,
                            !chatEnabled && styles.chatButtonDisabled
                        ]}
                        onPress={() => handleOpenChat(item)}
                        disabled={!chatEnabled}
                    >
                        <IconMessageSquare size={16} color="white" />
                        <Text style={styles.chatButtonText}>
                            {chatEnabled ? 'Chat' : 'Locked'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Applications</Text>
            </View>

            {/* Filters */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {FILTER_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.filterChip,
                                filter === opt.value && styles.filterChipActive
                            ]}
                            onPress={() => setFilter(opt.value)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    filter === opt.value && styles.filterTextActive
                                ]}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#7c3aed" />
                </View>
            ) : (
                <FlatList
                    data={filteredApps}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#7c3aed']}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <IconFile size={48} color="#e2e8f0" />
                            <Text style={styles.emptyText}>No applications found</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        padding: 24,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    filterContainer: {
        padding: 12,
        backgroundColor: 'white'
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginRight: 8
    },
    filterChipActive: {
        backgroundColor: '#7c3aed'
    },
    filterText: {
        color: '#64748b',
        fontWeight: '600'
    },
    filterTextActive: {
        color: 'white'
    },
    card: {
        backgroundColor: 'white',
        padding: 16,
        margin: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    cardInfo: {
        flex: 1
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    companyName: {
        color: '#64748b'
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold'
    },
    cardFooter: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    dateText: {
        fontSize: 12,
        color: '#94a3b8'
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7c3aed',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        gap: 6
    },
    chatButtonDisabled: {
        backgroundColor: '#cbd5e1'
    },
    chatButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 80
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#334155',
        marginTop: 16
    }
});