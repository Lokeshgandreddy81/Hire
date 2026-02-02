import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    ScrollView,
    Alert,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { IconSparkles, IconVideo, IconFile, IconX, IconBriefcase } from './Icons';
import { UserRole } from '../types';

// Child Components (Built in previous steps)
import VideoInterview from './VideoInterview';
import ProfileCreationForm from './ProfileCreationForm';
import JobCreationForm from './JobCreationForm';

// =============================================================================
// TYPES
// =============================================================================

interface SmartInterviewProps {
    onClose: () => void;
    onComplete: (result: any) => void;
    role: UserRole;
}

type WizardStep = 'MODE_SELECTION' | 'TEXT_FORM' | 'VIDEO_INTERVIEW';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const SmartInterview: React.FC<SmartInterviewProps> = ({ onClose, onComplete, role }) => {
    // State Machine - BOTH roles start with mode selection
    const [step, setStep] = useState<WizardStep>('MODE_SELECTION');

    // =========================================================================
    // HANDLERS
    // =========================================================================

    const handleFormSuccess = () => {
        // Delay slightly to allow success alert to clear
        setTimeout(() => {
            onComplete({ status: 'success' });
        }, 500);
    };

    const handleVideoComplete = (profileData: any) => {
        // Video upload handles the saving internally via ProfileAPI
        onComplete(profileData);
    };

    // =========================================================================
    // RENDERERS
    // =========================================================================

    const renderModeSelection = () => {
        // Role-specific content
        const isEmployer = role === UserRole.EMPLOYER;
        const headerTitle = isEmployer ? 'Smart Job Posting' : 'Smart Profile Builder';
        const mainTitle = 'How would you like to start?';
        const subtitle = isEmployer
            ? 'Choose how you want to describe your job opening.'
            : 'Choose how you want to present yourself to employers.';

        // Video option labels
        const videoTitle = isEmployer ? 'AI Video Description' : 'AI Video Interview';
        const videoDesc = isEmployer
            ? 'Record a video describing the job. AI extracts requirements automatically.'
            : 'Answer 4 simple questions. Our AI extracts your skills automatically.';

        // Text option labels
        const textTitle = isEmployer ? 'Manual Job Form' : 'Manual Profile';
        const textDesc = isEmployer
            ? 'Fill out a standard form with job details and requirements.'
            : 'Fill out a standard form with your details and skills.';

        return (
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <IconSparkles size={24} color="#a855f7" />
                        <Text style={styles.headerTitle}>{headerTitle}</Text>
                    </View>
                    <Pressable onPress={onClose} style={styles.closeBtn}>
                        <IconX size={24} color="#64748b" />
                    </Pressable>
                </View>

                <View style={styles.selectionBody}>
                    <Text style={styles.title}>{mainTitle}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>

                    <View style={styles.modeContainer}>
                        {/* OPTION 1: VIDEO (Recommended) */}
                        <Pressable
                            onPress={() => {
                                if (role === UserRole.EMPLOYER) {
                                    Alert.alert("Coming Soon", "Video Job Posting is currently in beta. Please use the Manual Job Form.");
                                    return;
                                }
                                setStep('VIDEO_INTERVIEW');
                            }}
                            style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#faf5ff' }]}>
                                <IconVideo size={32} color="#9333ea" />
                            </View>
                            <View style={styles.modeInfo}>
                                <Text style={styles.modeTitle}>{videoTitle}</Text>
                                <Text style={styles.modeDesc}>{videoDesc}</Text>
                            </View>
                            <View style={styles.badgeActive}>
                                <Text style={styles.badgeTextActive}>RECOMMENDED</Text>
                            </View>
                        </Pressable>

                        {/* OPTION 2: TEXT */}
                        <Pressable
                            onPress={() => setStep('TEXT_FORM')}
                            style={({ pressed }) => [styles.modeCard, pressed && styles.modeCardPressed]}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#f1f5f9' }]}>
                                <IconFile size={32} color="#64748b" />
                            </View>
                            <View style={styles.modeInfo}>
                                <Text style={styles.modeTitle}>{textTitle}</Text>
                                <Text style={styles.modeDesc}>{textDesc}</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    };

    // =========================================================================
    // MAIN RENDER SWITCH
    // =========================================================================

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={true}
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >

                {/* STATE 1: MODE SELECTION (Candidates Only) */}
                {step === 'MODE_SELECTION' && renderModeSelection()}

                {/* STATE 2: TEXT FORMS */}
                {step === 'TEXT_FORM' && (
                    role === UserRole.EMPLOYEE ? (
                        <ProfileCreationForm
                            onClose={onClose}
                            onSuccess={handleFormSuccess}
                        />
                    ) : (
                        <JobCreationForm
                            onClose={onClose}
                            onSuccess={handleFormSuccess}
                        />
                    )
                )}

                {/* STATE 3: VIDEO INTERVIEW (Candidates Only) */}
                {step === 'VIDEO_INTERVIEW' && (
                    <VideoInterview
                        onClose={() => setStep('MODE_SELECTION')}
                        onComplete={handleVideoComplete}
                    />
                )}

            </KeyboardAvoidingView>
        </Modal>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    content: {
        flex: 1,
    },
    selectionBody: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginTop: -60, // Visual offset to center vertically better
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: Platform.OS === 'android' ? 40 : 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 40,
        textAlign: 'center',
        maxWidth: '80%',
        lineHeight: 24,
    },
    modeContainer: {
        width: '100%',
        gap: 20,
    },
    modeCard: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    modeCardPressed: {
        backgroundColor: '#f8fafc',
        borderColor: '#cbd5e1',
        transform: [{ scale: 0.98 }],
    },
    modeInfo: {
        flex: 1,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modeTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    modeDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
    },
    badgeActive: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeTextActive: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#15803d',
    },
});

export default SmartInterview;