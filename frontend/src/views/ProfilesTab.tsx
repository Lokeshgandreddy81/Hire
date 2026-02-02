import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
    Image,
    Modal,
    RefreshControl,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { User, UserRole, Profile, TalentPool, Application } from '../types';
import { IconBriefcase, IconCheck, IconVideo, IconPlus, IconX, IconArrowLeft } from '../components/Icons';
import { ProfileAPI, JobAPI, ApplicationAPI } from '../services/api';
import InterviewModeSelector from '../components/InterviewModeSelector';
import ProfileCreationForm from '../components/ProfileCreationForm';
import JobCreationForm from '../components/JobCreationForm';

// =============================================================================
// TYPES
// =============================================================================

interface ProfilesTabProps {
    currentUser: User;
    onTriggerInterview: () => void; // Opens the main Smart Wizard
}

// =============================================================================
// SUB-COMPONENTS (Extracted for Performance)
// =============================================================================

const TitleValueRow = ({ title, value }: { title: string, value: string }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{title}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const CandidateDetailView = ({ candidate, onBack, onStatusUpdate, navigation }: { candidate: any, onBack: () => void, onStatusUpdate: (status: 'accepted' | 'rejected') => void, navigation: any }) => (
    <View style={styles.container}>
        <View style={styles.subHeader}>
            <Pressable onPress={onBack} style={styles.backButton}>
                <IconArrowLeft size={24} color="#64748b" />
                <Text style={styles.backText}>Back</Text>
            </Pressable>

            <View style={styles.candidateHeader}>
                <View style={styles.candidateAvatarBox}>
                    <Text style={styles.avatarLetter}>{(candidate.candidateName || "C").charAt(0)}</Text>
                </View>
                <View>
                    <Text style={styles.candidateName}>{candidate.candidateName}</Text>
                    <Text style={styles.candidateRole}>{candidate.jobTitle}</Text>
                    <View style={styles.tagsRow}>
                        <View style={[styles.matchBadge, { backgroundColor: candidate.status === 'requested' ? '#fff7ed' : (candidate.status === 'rejected' ? '#fef2f2' : '#f0fdf4') }]}>
                            <Text style={[styles.matchText, { color: candidate.status === 'requested' ? '#c2410c' : (candidate.status === 'rejected' ? '#ef4444' : '#16a34a') }]}>
                                {candidate.status.toUpperCase()}
                            </Text>
                        </View>
                        {candidate.matchPercentage && (
                            <View style={styles.expBadge}>
                                <Text style={styles.expText}>{candidate.matchPercentage}% MATCH</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollPadding}>
            <View style={styles.detailsCard}>
                <Text style={styles.cardHeader}>Application Details</Text>
                <TitleValueRow title="Applied For" value={candidate.jobTitle} />
                <TitleValueRow title="Status" value={candidate.status} />
                <TitleValueRow title="Applied On" value={new Date(candidate.created_at || Date.now()).toLocaleDateString()} />
            </View>

            {candidate.candidate_profile && (
                <View style={styles.summaryCard}>
                    <Text style={styles.cardHeader}>Candidate Profile</Text>
                    <Text style={styles.bodyText}>{candidate.candidate_profile.summary || "No summary provided."}</Text>
                    <View style={{ height: 16 }} />
                    <TitleValueRow title="Location" value={candidate.candidate_profile.location || "N/A"} />
                    <TitleValueRow title="Exp" value={`${candidate.candidate_profile.experience_years || 0} Years`} />
                    <TitleValueRow title="Skills" value={(candidate.candidate_profile.skills || []).join(', ')} />
                </View>
            )}
        </ScrollView>

        {/* ACTIONS */}
        <View style={styles.actionFooter}>
            {candidate.status === 'accepted' ? (
                <Pressable
                    style={styles.actionButton}
                    style={[styles.actionButton, styles.shortlistBtn]}
                    onPress={() => navigation.navigate('Applications')}
                >
                    <Text style={styles.shortlistText}>Go to Chat</Text>
                </Pressable>
            ) : (
                <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
                    <Pressable
                        style={[styles.actionButton, styles.rejectBtn]}
                        onPress={() => onStatusUpdate('rejected')}
                    >
                        <Text style={styles.rejectText}>Reject</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.actionButton, styles.shortlistBtn]}
                        onPress={() => onStatusUpdate('accepted')}
                    >
                        <Text style={styles.shortlistText}>Accept Request</Text>
                    </Pressable>
                </View>
            )}
        </View>
    </View>
);

const TalentPoolView = ({ pool, onBack, onSelectCandidate }: { pool: TalentPool, onBack: () => void, onSelectCandidate: (p: Profile) => void }) => (
    <View style={styles.container}>
        <View style={styles.subHeader}>
            <Pressable onPress={onBack} style={styles.backButton}>
                <IconArrowLeft size={20} color="#64748b" />
                <Text style={styles.backText}>Back to Pools</Text>
            </Pressable>
            <View style={{ marginTop: 16 }}>
                <Text style={styles.headerTitle}>{pool.name}</Text>
                <Text style={styles.headerSubtitle}>{pool.count} Candidates • {pool.tags.join(', ')}</Text>
            </View>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
            {pool.candidates && pool.candidates.length > 0 ? pool.candidates.map((candidate: any) => (
                <Pressable key={candidate.id} style={styles.candidateCard} onPress={() => onSelectCandidate(candidate)}>
                    <View style={styles.candidateCardHeader}>
                        <View style={styles.miniAvatar}><Text>{(candidate.candidateName || 'C').charAt(0)}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.profileName}>{candidate.candidateName || 'Candidate'}</Text>
                            <Text style={styles.profileRole}>{candidate.jobTitle}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            {/* STATUS BADGE */}
                            <View style={[styles.matchBadge, {
                                backgroundColor: candidate.status === 'accepted' ? '#f0fdf4' : (candidate.status === 'rejected' ? '#fef2f2' : '#fff7ed'),
                                marginBottom: 4
                            }]}>
                                <Text style={[styles.matchText, {
                                    color: candidate.status === 'accepted' ? '#16a34a' : (candidate.status === 'rejected' ? '#ef4444' : '#c2410c')
                                }]}>
                                    {candidate.status.toUpperCase()}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.skillRow}>
                        <Text style={styles.skillList}>Applied: {new Date(candidate.created_at || Date.now()).toLocaleDateString()}</Text>
                    </View>
                </Pressable>
            )) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No candidates in this pool yet.</Text>
                </View>
            )}
        </ScrollView>
    </View>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const ProfilesTab: React.FC<ProfilesTabProps & { navigation: any }> = ({ currentUser, onTriggerInterview, navigation }) => {
    const isEmployee = currentUser?.role === UserRole.EMPLOYEE;

    // State
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [pools, setPools] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Selection State
    const [selectedPool, setSelectedPool] = useState<TalentPool | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<Profile | null>(null);

    // Modal State
    const [showModeSelect, setShowModeSelect] = useState(false);
    const [isEditing, setIsEditing] = useState<boolean | any>(false);

    // Fetch Logic
    const fetchData = async () => {
        try {
            if (isEmployee) {
                const data = await ProfileAPI.getMyProfiles();
                // API might return array or single object
                const list = Array.isArray(data) ? data : (data ? [data] : []);
                setProfiles(list);
            } else {
                // Employer: Fetch Pools (Real Data)
                const [myJobs, allApps] = await Promise.all([
                    JobAPI.getMyJobs(),
                    ApplicationAPI.getAll()
                ]);

                // Group Apps by Job
                const poolsMap = new Map();

                // Initialize pools with active jobs
                myJobs.forEach((job: any) => {
                    const safeId = String(job.id || job._id);
                    poolsMap.set(safeId, {
                        id: safeId,
                        name: job.title,
                        count: 0,
                        tags: job.skills || [],
                        candidates: []
                    });
                });

                // Distribute applications
                if (Array.isArray(allApps)) {
                    allApps.forEach((app: any) => {
                        // Match roughly by Job ID (ensure string comparison)
                        // Backend returns 'job_id', Map uses 'id' from job
                        const rawJId = app.job_id || app.jobId;
                        if (rawJId) {
                            const jId = String(rawJId);
                            if (poolsMap.has(jId)) {
                                const pool = poolsMap.get(jId);
                                pool.candidates.push(app);
                                pool.count++;
                            } else {
                                console.log('DEBUG: Orphan App', app.id, 'for Job', jId);
                            }
                        }
                    });
                }

                setPools(Array.from(poolsMap.values()));
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
            fetchData();
        }, [isEmployee])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleFormSuccess = () => {
        setIsEditing(false);
        onRefresh();
    };

    const handleStatusUpdate = async (status: 'accepted' | 'rejected') => {
        if (!selectedCandidate) return;
        try {
            await ApplicationAPI.updateStatus(selectedCandidate.id, status);

            if (status === 'accepted') {
                Alert.alert("Success", "Candidate Accepted! Redirecting to chat...");
                setSelectedCandidate(null);
                // 🔒 WORKFLOW: Explicit redirect to Chat List (Applications Tab)
                navigation.navigate('Applications');
            } else {
                Alert.alert("Updated", "Candidate Rejected.");
                fetchData();
                setSelectedCandidate(null);
            }
        } catch (e) {
            Alert.alert("Error", "Failed to update status");
        }
    };

    // Render Logic Switches
    if (selectedCandidate) return <CandidateDetailView candidate={selectedCandidate} onBack={() => setSelectedCandidate(null)} onStatusUpdate={handleStatusUpdate} navigation={navigation} />;
    if (selectedPool) return <TalentPoolView pool={selectedPool} onBack={() => setSelectedPool(null)} onSelectCandidate={setSelectedCandidate} />;

    return (
        <View style={styles.container}>
            <View style={styles.mainHeader}>
                <View>
                    <Text style={styles.headerTitle}>{isEmployee ? 'My Profile' : 'Talent Pools'}</Text>
                    <Text style={styles.headerSubtitle}>
                        {isEmployee ? 'Manage your professional identity' : 'Find the best talent for your gigs'}
                    </Text>
                </View>
                {!isEmployee && (
                    <Pressable style={styles.iconButton}>
                        <IconBriefcase size={20} color="#64748b" />
                    </Pressable>
                )}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {isLoading && !refreshing ? (
                    <ActivityIndicator size="large" color="#7c3aed" />
                ) : (
                    <>
                        {/* EMPLOYEE VIEW */}
                        {isEmployee && (
                            <View>
                                {profiles.length === 0 ? (
                                    <View style={styles.emptyCard}>
                                        <Text style={styles.emptyTitle}>No Profile Yet</Text>
                                        <Text style={styles.emptyDesc}>Create a profile to get matched with jobs.</Text>
                                        <Pressable style={styles.createBtnMain} onPress={() => setShowModeSelect(true)}>
                                            <Text style={styles.createBtnText}>Create Profile</Text>
                                        </Pressable>
                                    </View>
                                ) : (
                                    profiles.map(profile => (
                                        <View key={profile.id} style={styles.profileCard}>
                                            <View style={styles.profileHeader}>
                                                <View style={styles.profileHeader}>
                                                    <Image source={{ uri: currentUser?.avatar || 'https://ui-avatars.com/api/?name=User' }} style={styles.avatar} />
                                                    <View>
                                                        <Text style={styles.welcomeText}>Welcome back,</Text>
                                                        <Text style={styles.profileName}>{currentUser?.name || "User"}</Text>
                                                        <Text style={styles.profileRole}>{profile.roleTitle}</Text>
                                                    </View>
                                                </View>{profile.isDefault && (
                                                    <View style={styles.defaultBadge}>
                                                        <Text style={styles.defaultBadgeText}>ACTIVE</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.statsRow}>
                                                <View style={styles.statItem}>
                                                    <Text style={styles.statValue}>{profile.experienceYears}y</Text>
                                                    <Text style={styles.statLabel}>Exp</Text>
                                                </View>
                                                <View style={styles.statSeparator} />
                                                <View style={styles.statItem}>
                                                    <Text style={styles.statValue}>{profile.skills.length}</Text>
                                                    <Text style={styles.statLabel}>Skills</Text>
                                                </View>
                                                <View style={styles.statSeparator} />
                                                <View style={styles.statItem}>
                                                    <Text style={styles.statValue}>4.8</Text>
                                                    <Text style={styles.statLabel}>Rating</Text>
                                                </View>
                                            </View>

                                            <Pressable style={styles.editButton} onPress={() => setIsEditing(profile)}>
                                                <Text style={styles.editButtonText}>Edit Profile</Text>
                                            </Pressable>
                                        </View>
                                    ))
                                )}

                                {profiles.length > 0 && (
                                    <Pressable style={styles.createCard} onPress={() => setShowModeSelect(true)}>
                                        <View style={styles.createIconBg}>
                                            <IconPlus size={24} color="#7c3aed" />
                                        </View>
                                        <Text style={styles.createText}>Create Another Profile</Text>
                                    </Pressable>
                                )}
                            </View>
                        )}

                        {/* EMPLOYER VIEW: RENDER POOLS LIST */}
                        {!isEmployee && (
                            <View>
                                {pools.length === 0 ? (
                                    <View style={styles.emptyCard}>
                                        <Text style={styles.emptyTitle}>No Jobs / Pools Yet</Text>
                                        <Text style={styles.emptyDesc}>
                                            Post a job to start collecting applications.
                                        </Text>
                                        <Pressable style={styles.createBtnMain} onPress={() => onTriggerInterview()}>
                                            <Text style={styles.createBtnText}>Post a Job</Text>
                                        </Pressable>
                                    </View>
                                ) : (
                                    pools.map((pool) => (
                                        <Pressable key={pool.id} style={styles.poolCard} onPress={() => setSelectedPool(pool)}>
                                            <View style={styles.poolHeader}>
                                                <Text style={styles.poolName}>{pool.name}</Text>
                                                <View style={styles.countBadge}>
                                                    <Text style={styles.countText}>{pool.count} ACTIVE</Text>
                                                </View>
                                            </View>
                                            {/* Avatar Pile Mock */}
                                            <View style={styles.avatarPile}>
                                                {[1, 2, 3].map(i => (
                                                    <View key={i} style={[styles.pileAvatar, { backgroundColor: '#f1f5f9', marginLeft: i > 1 ? -12 : 0 }]}>
                                                        <Text style={{ fontSize: 10 }}>U{i}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                            <View style={styles.poolFooter}>
                                                <Text style={styles.poolStatus}>Tap to View {pool.count} Candidates</Text>
                                            </View>
                                        </Pressable>
                                    ))
                                )}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Employee FAB for Video Interview */}
            {isEmployee && (
                <Pressable
                    style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
                    onPress={() => setShowModeSelect(true)}
                >
                    <IconVideo size={28} color="white" />
                </Pressable>
            )}

            {/* Employer FAB for Job Posting */}
            {!isEmployee && (
                <Pressable
                    style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
                    onPress={() => setShowModeSelect(true)}
                >
                    <IconPlus size={28} color="white" />
                </Pressable>
            )}

            {/* Modals */}
            <InterviewModeSelector
                visible={showModeSelect}
                onClose={() => setShowModeSelect(false)}
                onSelectMode={(mode) => {
                    setShowModeSelect(false);
                    if (mode === 'text') setIsEditing(true);
                    else onTriggerInterview();
                }}
            />

            <Modal visible={!!isEditing} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    {isEmployee ? (
                        <ProfileCreationForm
                            onClose={() => setIsEditing(false)}
                            onSuccess={handleFormSuccess}
                            initialData={typeof isEditing === 'object' ? isEditing : undefined}
                        />
                    ) : (
                        <JobCreationForm onClose={() => setIsEditing(false)} onSuccess={handleFormSuccess} />
                    )}
                </View>
            </Modal>
        </View>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    modalContainer: { flex: 1, backgroundColor: 'white' },

    // Headers
    mainHeader: { backgroundColor: 'white', padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    subHeader: { backgroundColor: 'white', padding: 24, paddingBottom: 24, borderBottomWidth: 1, borderColor: '#f1f5f9' },
    headerTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 13, fontWeight: '500', color: '#64748b', marginTop: 4 },
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backText: { fontSize: 16, fontWeight: 'bold', color: '#64748b', marginLeft: 8 },
    iconButton: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 12 },

    content: { padding: 16, paddingBottom: 100 },
    scrollPadding: { padding: 24 },

    // Empty State
    emptyCard: { alignItems: 'center', padding: 40, backgroundColor: 'white', borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0' },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
    createBtnMain: { backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    createBtnText: { color: 'white', fontWeight: 'bold' },

    // Profile Card
    profileCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
    profileHeader: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    avatarContainer: { borderWidth: 3, borderRadius: 24, padding: 2 },
    avatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#f1f5f9' },
    activeBadge: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, backgroundColor: '#10b981', borderRadius: 7, borderWidth: 2, borderColor: 'white' },
    profileName: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
    profileRole: { fontSize: 13, fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginTop: 2 },
    defaultBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
    defaultBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },

    statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 16 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
    statLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 },
    statSeparator: { width: 1, height: 24, backgroundColor: '#e2e8f0' },

    editButton: { backgroundColor: '#0f172a', padding: 16, borderRadius: 16, alignItems: 'center' },
    editButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

    // Create New Card
    createCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', flexDirection: 'row', gap: 12 },
    createIconBg: { width: 40, height: 40, backgroundColor: '#f3e8ff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    createText: { fontSize: 14, fontWeight: 'bold', color: '#7c3aed' },

    // Pool Card
    poolCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    poolHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' },
    poolName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', flex: 1 },
    countBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    countText: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
    avatarPile: { flexDirection: 'row', height: 32, marginBottom: 16, paddingLeft: 4 },
    pileAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
    poolFooter: { paddingTop: 16, borderTopWidth: 1, borderColor: '#f1f5f9' },
    poolStatus: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },

    // Detail View
    candidateHeader: { flexDirection: 'row', gap: 16, alignItems: 'center' },
    candidateAvatarBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    avatarLetter: { fontSize: 24, fontWeight: 'bold', color: '#64748b' },
    candidateName: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
    candidateRole: { fontSize: 13, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
    tagsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
    matchBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    matchText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },
    expBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    expText: { fontSize: 10, fontWeight: 'bold', color: '#3b82f6' },
    summaryCard: { backgroundColor: 'white', padding: 24, borderRadius: 24, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    cardHeader: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    bodyText: { fontSize: 14, color: '#475569', lineHeight: 22 },
    detailsCard: { backgroundColor: 'white', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: '#e2e8f0', gap: 16 },
    detailRow: { marginBottom: 4 },
    detailLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
    detailValue: { fontSize: 14, color: '#0f172a', fontWeight: '600' },

    // Footer Actions
    actionFooter: { flexDirection: 'row', gap: 12, padding: 24, borderTopWidth: 1, borderColor: '#e2e8f0', backgroundColor: 'white' },
    actionButton: { padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flex: 1 },
    rejectBtn: { backgroundColor: '#f1f5f9' },
    rejectText: { color: '#64748b', fontWeight: 'bold' },
    shortlistBtn: { backgroundColor: '#7c3aed', flex: 2 },
    shortlistText: { color: 'white', fontWeight: 'bold' },

    // Candidates in Pool
    candidateCard: { flexDirection: 'column', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9' },
    candidateCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    miniAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3e8ff', alignItems: 'center', justifyContent: 'center' },
    scoreText: { fontSize: 16, fontWeight: '900', color: '#16a34a' },
    matchLabel: { fontSize: 8, fontWeight: 'bold', color: '#86efac' },
    skillRow: { flexDirection: 'row' },
    skillList: { fontSize: 12, color: '#64748b' },
    emptyState: { alignItems: 'center', padding: 24 },
    emptyText: { color: '#94a3b8', fontStyle: 'italic' },

    // FAB
    fab: { position: 'absolute', bottom: 100, right: 20, width: 60, height: 60, backgroundColor: '#7c3aed', borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    fabPressed: { transform: [{ scale: 0.95 }] },
});

export default ProfilesTab;