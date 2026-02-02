// ApplicationsTab.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ApplicationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { IconMessageSquare, IconLock } from '../components/Icons';

export default function ApplicationsTab({ navigation }: any) {
    const { userInfo } = useAuth();
    const [apps, setApps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ---------------------------------------------------------------------
    // LOAD APPLICATIONS (BACKEND IS TRUTH)
    // ---------------------------------------------------------------------
    const loadApps = async () => {
        setLoading(true);
        try {
            const data = await ApplicationAPI.getAll();
            if (Array.isArray(data)) {
                // 🔒 FILTERING LOGIC:
                // Employer: Only show ACCEPTED applications (Active Chats)
                // Candidate: Show ALL (Requested, Accepted, Rejected)
                let filtered = data;
                if (userInfo?.role === UserRole.EMPLOYER) {
                    filtered = data.filter((app: any) => app.status === 'accepted');
                }
                setApps(filtered);
            } else {
                setApps([]);
            }
        } catch (e) {
            console.error('❌ LOAD APPLICATIONS FAILED:', e);
            setApps([]);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadApps();
        }, [])
    );

    // ---------------------------------------------------------------------
    // CHAT NAVIGATION (STRICT)
    // ---------------------------------------------------------------------
    const openChat = (app: any) => {
        if (!app.chatId) {
            Alert.alert(
                'Chat Locked',
                'Chat will unlock once the employer accepts the application.'
            );
            return;
        }

        navigation.navigate('Chat', {
            chatId: app.chatId,
            name: app.companyName
        });
    };

    // ---------------------------------------------------------------------
    // UI STATES
    // ---------------------------------------------------------------------
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#7c3aed" />
            </View>
        );
    }

    if (apps.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyText}>No applications yet.</Text>
            </View>
        );
    }

    // ---------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------
    return (
        <FlatList
            data={apps}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
                const locked =
                    userInfo?.role === UserRole.EMPLOYEE &&
                    !item.chatId;

                return (
                    <TouchableOpacity
                        style={[
                            styles.card,
                            locked && styles.cardLocked
                        ]}
                        onPress={() => openChat(item)}
                        disabled={locked}
                    >
                        <View style={styles.row}>
                            <Text style={styles.title}>
                                {item.companyName}
                            </Text>
                            {locked && <IconLock size={16} color="#94a3b8" />}
                        </View>

                        <Text style={styles.subtitle}>
                            {item.jobTitle}
                        </Text>

                        <Text style={styles.status}>
                            Status: {item.status.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                );
            }}
        />
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b'
    },
    card: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    cardLocked: {
        opacity: 0.6,
        backgroundColor: '#f8fafc'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    subtitle: {
        marginTop: 4,
        fontSize: 13,
        color: '#7c3aed'
    },
    status: {
        marginTop: 8,
        fontSize: 12,
        color: '#64748b'
    }
});