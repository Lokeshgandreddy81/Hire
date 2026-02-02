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

            if (userInfo?.role === UserRole.EMPLOYEE && data?.description) {
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

            Alert.alert(
                'Application Sent',
                'Your request has been sent. Chat will unlock once the employer accepts.'
            );

            // 🔒 Reload job from backend (authoritative)
            await loadJob();
        } catch (e: any) {
            Alert.alert(
                'Application Failed',
                e?.message || 'You may have already applied.'
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
            </View>
        );
    }

    if (!job) return null;

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <IconArrowLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Job Details</Text>
                <TouchableOpacity onPress={handleShare} style={styles.iconBtn}>
                    <IconShare size={24} color="#1e293b" />
                </TouchableOpacity>
            </View>

            <ScrollView>
                <View style={styles.section}>
                    <Text style={styles.title}>{job.title}</Text>
                    <Text style={styles.company}>{job.company}</Text>

                    <View style={styles.metaRow}>
                        <IconMapPin size={16} color="#64748b" />
                        <Text style={styles.metaText}>{job.location}</Text>
                        <IconClock size={16} color="#64748b" />
                        <Text style={styles.metaText}>{job.postedAt || 'Recently'}</Text>
                    </View>
                </View>

                {!isEmployer && matchReason && (
                    <View style={styles.aiCard}>
                        <View style={styles.aiHeader}>
                            <IconSparkles size={18} color="#7c3aed" />
                            <Text style={styles.aiTitle}>AI Match</Text>
                            <Text style={styles.matchText}>
                                {job.match_percentage}%
                            </Text>
                        </View>
                        <Text style={styles.aiText}>{matchReason}</Text>
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{job.description}</Text>
                </View>
            </ScrollView>

            {/* FOOTER */}
            <View style={styles.footer}>
                {isEmployer ? (
                    <TouchableOpacity style={styles.editBtn}>
                        <Text style={styles.applyBtnText}>Edit Job</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.applyBtn,
                            (applying || job.application_status === 'requested') &&
                            styles.applyBtnDisabled
                        ]}
                        onPress={handleApply}
                        disabled={applying || job.application_status === 'requested'}
                    >
                        {applying ? (
                            <ActivityIndicator color="#fff" />
                        ) : job.application_status === 'requested' ? (
                            <>
                                <IconCheck size={18} color="#fff" />
                                <Text style={styles.applyBtnText}>Requested</Text>
                            </>
                        ) : (
                            <>
                                <IconBriefcase size={18} color="#fff" />
                                <Text style={styles.applyBtnText}>
                                    Request to Join
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
    iconBtn: { padding: 8, borderRadius: 20, backgroundColor: '#f8fafc' },
    section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
    company: { fontSize: 16, color: '#64748b', marginBottom: 16 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: '#64748b', marginRight: 12 },
    aiCard: { margin: 20, padding: 16, backgroundColor: '#f5f3ff', borderRadius: 16, borderWidth: 1, borderColor: '#ddd6fe' },
    aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    aiTitle: { fontSize: 14, fontWeight: 'bold', color: '#7c3aed', flex: 1 },
    matchText: { fontSize: 14, fontWeight: 'bold', color: '#166534', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    aiText: { fontSize: 14, color: '#4c1d95', lineHeight: 22 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 12 },
    description: { fontSize: 15, lineHeight: 24, color: '#334155' },
    footer: { padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7c3aed', padding: 16, borderRadius: 16, gap: 8 },
    applyBtnDisabled: { backgroundColor: '#94a3b8', opacity: 0.8 },
    editBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: 16, borderRadius: 16 },
    applyBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
