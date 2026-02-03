// JobDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Share
} from 'react-native';
import { Job, UserRole } from '../types';
import { JobAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { generateMatchExplanation } from '../services/geminiService';
import {
    IconArrowLeft,
    IconBriefcase,
    IconMapPin,
    IconCheck,
    IconShare,
    IconSparkles,
    IconClock
} from '../components/Icons';
import { AnimatedButton } from '../components/MotionHelpers';

// =============================================================================
// TYPES
// =============================================================================

interface JobDetailRouteParams {
    jobId: string;
}

interface JobDetailScreenProps {
    navigation: any; // Kept loose as permitted, can be tightened to NativeStackScreenProps later
    route: {
        params: JobDetailRouteParams;
    };
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function JobDetailScreen({ navigation, route }: JobDetailScreenProps) {
    const { jobId } = route.params;
    const { userInfo } = useAuth();

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [applying, setApplying] = useState<boolean>(false);
    const [matchReason, setMatchReason] = useState<string>('');

    const isEmployer = userInfo?.role === UserRole.EMPLOYER;

    // ---------------------------------------------------------------------
    // LOAD JOB (SINGLE SOURCE OF TRUTH)
    // ---------------------------------------------------------------------
    const loadJob = async () => {
        setLoading(true);
        try {
            const data = await JobAPI.getJobById(jobId);
            setJob(data);

            if (userInfo?.role === UserRole.JOB_SEEKER && data?.description) {
                const mockProfile =
                    'Experienced driver with HMV license and 5 years experience.';
                const reason = await generateMatchExplanation(
                    data.description,
                    mockProfile
                );
                setMatchReason(reason);
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to load job.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJob();
    }, [jobId]);

    // ---------------------------------------------------------------------
    // APPLY FLOW — BACKEND CONTROLS STATE
    // ---------------------------------------------------------------------
    const handleApply = async () => {
        if (!job || applying) return;

        setApplying(true);
        try {
            await JobAPI.applyToJob(job.id);
            // 🔒 Reload job from backend to confirm status
            await loadJob();
        } catch (e: any) {
            // Only alert on FAILURE, but keep it gentle
            Alert.alert(
                'Something went wrong',
                'We couldn\'t send your application. Please try again.'
            );
        } finally {
            setApplying(false);
        }
    };

    const handleShare = async () => {
        await Share.share({
            message: `Check out this job: ${job?.title} at ${job?.company}`
        });
    };

    // ---------------------------------------------------------------------
    // RENDER
    // ---------------------------------------------------------------------
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.loadingText}>Finding details...</Text>
            </View>
        );
    }

    if (!job) return null;

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <IconArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                    <IconShare size={24} color="#0f172a" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.heroSection}>
                    <Text style={styles.title}>{job.title}</Text>
                    <Text style={styles.company}>{job.company}</Text>

                    <View style={styles.metaTags}>
                        <View style={styles.tag}>
                            <IconMapPin size={14} color="#64748b" />
                            <Text style={styles.tagText}>{job.location}</Text>
                        </View>
                        <View style={styles.tag}>
                            <IconClock size={14} color="#64748b" />
                            <Text style={styles.tagText}>{job.postedAt || 'Recently'}</Text>
                        </View>
                    </View>
                </View>

                {!isEmployer && matchReason && (
                    <View style={styles.insightCard}>
                        <View style={styles.insightHeader}>
                            <IconSparkles size={20} color="#7c3aed" />
                            <Text style={styles.insightTitle}>Why you're a match</Text>
                            <View style={styles.matchBadge}>
                                <Text style={styles.matchText}>{job.match_percentage}% Match</Text>
                            </View>
                        </View>
                        <Text style={styles.insightText}>{matchReason}</Text>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>The Role</Text>
                    <Text style={styles.description}>{job.description}</Text>
                </View>

                {/* Spacer for FAB */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FOOTER (Floating Action) */}
            <View style={styles.footer}>
                {isEmployer ? (
                    <TouchableOpacity style={styles.editBtn}>
                        <Text style={styles.editBtnText}>Edit Job</Text>
                    </TouchableOpacity>
                ) : (
                    <AnimatedButton
                        onPress={handleApply}
                        label="Request to Join"
                        loadingLabel="Requesting..."
                        successLabel="Request Sent"
                        isLoading={applying}
                        isSuccess={job.application_status === 'requested'}
                        style={styles.applyBtn}
                        textStyle={styles.applyBtnText}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: '#64748b', fontSize: 14, fontWeight: '500' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60, // Safe Area
        paddingBottom: 10
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center'
    },

    scrollContent: {
        paddingTop: 10
    },

    heroSection: {
        padding: 24,
        paddingBottom: 12
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#020617', // Slate-950
        marginBottom: 8,
        letterSpacing: -1,
        lineHeight: 38
    },
    company: {
        fontSize: 18,
        color: '#64748b',
        marginBottom: 20,
        fontWeight: '500'
    },
    metaTags: { flexDirection: 'row', gap: 12 },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    tagText: { fontSize: 13, color: '#475569', fontWeight: '600' },

    insightCard: {
        marginHorizontal: 24,
        marginVertical: 12,
        padding: 20,
        backgroundColor: '#fdf4ff', // Very light Fuchsia
        borderRadius: 20,
        // No border, just soft color
    },
    insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    insightTitle: { fontSize: 16, fontWeight: '800', color: '#7c3aed', flex: 1 },
    matchBadge: { backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    matchText: { fontSize: 12, fontWeight: '800', color: '#7c3aed' },
    insightText: { fontSize: 15, color: '#4c1d95', lineHeight: 24 },

    section: { padding: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
    description: { fontSize: 16, lineHeight: 26, color: '#334155' },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        paddingBottom: 40,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9'
    },
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a', // Slate-900 (Black) for confident action
        paddingVertical: 20,
        borderRadius: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
    },
    applyBtnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },
    applyBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

    editBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        paddingVertical: 20,
        borderRadius: 16
    },
    editBtnText: { color: '#0f172a', fontSize: 16, fontWeight: '600' }
});
