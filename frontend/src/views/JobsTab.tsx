// JobsTab.tsx
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    RefreshControl, // Added
} from 'react-native';
import { JobAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedCard, BreathingBlock } from '../components/MotionHelpers';

export default function JobsTab({ navigation }: any) {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // Added

    // ---------------------------------------------------------------------
    // LOAD JOBS — API IS SINGLE SOURCE OF TRUTH
    // 🔒 M1.3 FRONTEND LOCK: No client-side sorting, filtering, or math.
    // ---------------------------------------------------------------------
    const { userInfo } = useAuth();

    const loadJobs = async (isRefetch = false) => {
        if (!isRefetch) setLoading(true);
        try {
            // 🔒 M1.3 LOGIC BRANCH:
            // Employers -> See their own posted jobs
            // Candidates -> See matched jobs from Reality Engine
            const isEmployer = userInfo?.role === UserRole.EMPLOYER;

            const data = isEmployer
                ? await JobAPI.getMyJobs()
                : await JobAPI.getAllJobs();

            console.log(`JobsTab: Loaded ${data?.length || 0} jobs for ${userInfo?.role}`);

            setJobs(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('❌ JOB LOAD ERROR:', e);
            setJobs([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadJobs();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadJobs(true);
    }, []);

    // ---------------------------------------------------------------------
    // UI STATES
    // ---------------------------------------------------------------------
    // NOTE: Removed early return for empty jobs to enable RefreshControl via FlatList

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // ---------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>For You</Text>
                <Text style={styles.headerSubtitle}>
                    {userInfo?.role === UserRole.EMPLOYER
                        ? 'Your open positions'
                        : 'Jobs that match your life'
                    }
                </Text>
            </View>

            <FlatList
                data={jobs}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
                }
                ListEmptyComponent={
                    <View style={styles.center}>
                        <BreathingBlock>
                            <Text style={styles.emptyEmoji}>🌱</Text>
                        </BreathingBlock>
                        <Text style={styles.emptyTitle}>Nothing right now</Text>
                        <Text style={styles.emptyText}>
                            And that's okay. We'll notify you when{'\n'}the right opportunity arrives.
                        </Text>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <AnimatedCard
                        index={index}
                        style={styles.card}
                        isHighConfidence={item.match_percentage >= 90}
                        onPress={() =>
                            navigation.navigate('JobDetail', { jobId: item.id })
                        }
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                                {(item.match_percentage && item.match_percentage > 0) ? (
                                    <View style={[
                                        styles.matchBadge,
                                        item.match_percentage >= 90 && styles.highConfidenceBadge
                                    ]}>
                                        <Text style={[
                                            styles.matchText,
                                            item.match_percentage >= 90 && styles.highConfidenceText
                                        ]}>
                                            {item.match_percentage >= 90 ? "Strong fit" : `${item.match_percentage}%`}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                            <Text style={styles.company} numberOfLines={1}>{item.company}</Text>
                        </View>

                        <View style={styles.cardFooter}>
                            <Text style={styles.location}>📍 {item.location || 'Remote'}</Text>
                            <Text style={styles.salary}>
                                {item.salary_range || 'Salary negotiable'}
                            </Text>
                        </View>
                    </AnimatedCard>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc', // Slate-50 background for the whole tab
    },
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
        color: '#020617', // Slate-950
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 4,
        fontWeight: '500',
    },

    listContent: {
        padding: 24,
        paddingTop: 32,
        flexGrow: 1,
    },

    // Empty State
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        opacity: 0.8,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
    },

    // Card Design
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        // Soft Light Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    cardHeader: {
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    title: {
        fontSize: 18,
        fontWeight: '800', // System Strong
        color: '#0f172a',
        flex: 1,
        marginRight: 10,
    },
    company: {
        fontSize: 15,
        color: '#64748b',
        fontWeight: '500',
    },

    // Match Badge
    matchBadge: {
        backgroundColor: '#ecfdf5', // Emerald-50
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
    },
    highConfidenceBadge: {
        backgroundColor: '#f5f3ff', // Light violet
        borderColor: 'rgba(124, 58, 237, 0.1)',
    },
    matchText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#059669', // Emerald-600
    },
    highConfidenceText: {
        color: '#7c3aed', // Brand color
    },

    // Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    location: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '600',
    },
    salary: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569', // Slate-600
    },
});