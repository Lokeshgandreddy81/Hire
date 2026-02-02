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
        <FlatList
            data={jobs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }} // flexGrow ensures empty state centers
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
                <View style={styles.center}>
                    <Text style={styles.emptyText}>
                        No matching jobs yet.
                        {'\n'}Pull to refresh.
                    </Text>
                </View>
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.card}
                    onPress={() =>
                        navigation.navigate('JobDetail', { jobId: item.id })
                    }
                >
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.company}>{item.company}</Text>

                    <View style={styles.matchBadge}>
                        <Text style={styles.matchText}>
                            {item.match_percentage}% Match
                        </Text>
                    </View>
                </TouchableOpacity>
            )}
        />
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    company: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
    },
    matchBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    matchText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#166534',
    },
});