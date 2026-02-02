import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { IconCamera, IconMic, IconCheck, IconX, IconSparkles } from './Icons';

// =============================================================================
// CONFIGURATION
// =============================================================================

// DYNAMIC HOST RESOLUTION (Fixes "Network Error" on physical devices)
const getBackendUrl = () => {
    // In Prod: Return your AWS/Render URL
    // return "https://api.myapp.com";

    // In Dev: Get local IP from Expo
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0] || 'localhost';
    return `http://${localhost}:8000`;
};

const API_URL = getBackendUrl();

const QUESTIONS = [
    "Please state your full name and where you are currently based.",
    "Tell us about your work history. What roles have you held in the past 5 years?",
    "What are your core technical or professional skills?",
    "What are your educational or vocational qualifications?"
];

interface VideoInterviewProps {
    onClose: () => void;
    onComplete: (profile: any) => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const VideoInterview: React.FC<VideoInterviewProps> = ({ onClose, onComplete }) => {
    // State Machine
    const [step, setStep] = useState<'PREVIEW' | 'RECORDING' | 'PROCESSING' | 'REVIEW'>('PREVIEW');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // Prevents double-taps

    // Hardware Refs
    const [cameraRef, setCameraRef] = useState<CameraView | null>(null);
    const [cameraPerm, requestCameraPerm] = useCameraPermissions();
    const [micPerm, requestMicPerm] = useMicrophonePermissions();

    // Data
    const [recordedUri, setRecordedUri] = useState<string | null>(null);
    const [processedProfile, setProcessedProfile] = useState<any>(null);

    // Initial Permission Check
    useEffect(() => {
        (async () => {
            if (!cameraPerm?.granted) await requestCameraPerm();
            if (!micPerm?.granted) await requestMicPerm();
        })();
    }, []);

    // =========================================================================
    // RECORDING LOGIC (Musk First-Principles: Atomic State Transitions)
    // =========================================================================

    const handleStartRecording = async () => {
        if (!cameraRef || isRecording || isProcessing) return;

        setIsRecording(true);
        setStep('RECORDING');

        try {
            // Promise resolves when stopRecording() is called
            const videoData = await cameraRef.recordAsync({
                maxDuration: 60, // 1 min cap per answer


            });

            // This runs AFTER stopRecording()
            if (videoData?.uri) {
                handleRecordingFinished(videoData.uri);
            }
        } catch (e) {
            console.error("Recording failed:", e);
            Alert.alert("Camera Error", "Could not start recording.");
            setIsRecording(false);
            setStep('PREVIEW');
        }
    };

    const handleStopRecording = () => {
        if (cameraRef && isRecording) {
            cameraRef.stopRecording();
            // State update happens in the await recordAsync resolution above
            setIsRecording(false);
        }
    };

    const handleRecordingFinished = async (uri: string) => {
        // Validation: Ensure file actually exists
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
            Alert.alert("Error", "Video file was not saved.");
            setStep('PREVIEW');
            return;
        }

        // Logic: Single Take vs Multi-Question
        // For MVP stability: We assume the user answers continuously or we process the last clip.
        if (currentQuestionIndex < QUESTIONS.length - 1) {
            setRecordedUri(uri); // Cache this clip (in real app, append to array)
            setCurrentQuestionIndex(prev => prev + 1);
            setStep('PREVIEW'); // Pause to let user breathe
        } else {
            // Final submission
            setRecordedUri(uri);
            uploadVideo(uri);
        }
    };

    // =========================================================================
    // UPLOAD LOGIC (Cook Operational Discipline: Retry & Validation)
    // =========================================================================

    const uploadVideo = async (uri: string) => {
        setStep('PROCESSING');
        setIsProcessing(true);

        try {
            const token = await SecureStore.getItemAsync('userToken');
            if (!token) throw new Error("No authentication token found");

            // Construct Multipart Form
            const formData = new FormData();
            formData.append('video', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: `interview_${Date.now()}.mp4`,
                type: 'video/mp4'
            } as any);



            const response = await fetch(`${API_URL}/api/profiles/process-video-interview`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    // Note: Do NOT set 'Content-Type': 'multipart/form-data' manually in RN fetch;
                    // the browser engine handles boundary creation automatically.
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Server Error: ${response.status} - ${errText}`);
            }

            const result = await response.json();
            setProcessedProfile(result);
            setStep('REVIEW');

        } catch (error: any) {
            console.error("Upload Error:", error);
            Alert.alert(
                "Upload Failed",
                "Could not process video. Please ensure your backend is running and reachable.",
                [
                    { text: "Retry", onPress: () => uploadVideo(uri) },
                    { text: "Cancel", onPress: () => { setStep('PREVIEW'); setIsProcessing(false); } }
                ]
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    if (!cameraPerm?.granted || !micPerm?.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>Permissions Required</Text>
                <Text style={styles.permissionText}>We need camera and microphone access to conduct the interview.</Text>
                <TouchableOpacity onPress={requestCameraPerm} style={styles.permButton}>
                    <Text style={styles.permButtonText}>Grant Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={requestMicPerm} style={styles.permButton}>
                    <Text style={styles.permButtonText}>Grant Microphone</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <IconSparkles size={20} color="#a78bfa" />
                    <Text style={styles.headerTitle}>AI Interview</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <IconX size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {(step === 'PREVIEW' || step === 'RECORDING') && (
                    <View style={{ flex: 1 }}>
                        <CameraView
                            style={styles.camera}
                            facing="front"
                            ref={(ref) => setCameraRef(ref)}
                        >
                            <View style={styles.overlay}>
                                <View style={styles.questionCard}>
                                    <View style={styles.recordingIndicator}>
                                        <View style={[styles.recordingDot, isRecording && styles.recordingPulse]} />
                                        <Text style={styles.recordingText}>{isRecording ? 'Recording...' : 'Ready'}</Text>
                                    </View>
                                    <Text style={styles.questionText}>
                                        {QUESTIONS[currentQuestionIndex]}
                                    </Text>
                                    <Text style={styles.questionCounter}>Question {currentQuestionIndex + 1} of {QUESTIONS.length}</Text>
                                </View>
                            </View>
                        </CameraView>

                        <View style={styles.controls}>
                            {isRecording ? (
                                <TouchableOpacity onPress={handleStopRecording} style={styles.stopButton}>
                                    <View style={styles.stopIcon} />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity onPress={handleStartRecording} style={styles.recordButton}>
                                    <View style={styles.recordIcon} />
                                </TouchableOpacity>
                            )}
                            <Text style={styles.instructionText}>
                                {isRecording ? "Tap to Stop & Submit" : "Tap Red Button to Answer"}
                            </Text>
                        </View>
                    </View>
                )}

                {step === 'PROCESSING' && (
                    <View style={styles.processingContainer}>
                        <ActivityIndicator size="large" color="#a78bfa" />
                        <Text style={styles.processingTitle}>Analyzing Video...</Text>
                        <Text style={styles.processingDesc}>Our AI is extracting your skills and experience.</Text>
                        <Text style={styles.debugText}>Uploading to {API_URL}</Text>
                    </View>
                )}

                {step === 'REVIEW' && processedProfile && (
                    <View style={styles.reviewContainer}>
                        <View style={styles.successCard}>
                            <IconCheck size={48} color="#7c3aed" />
                            <Text style={styles.successTitle}>Profile Generated!</Text>

                            <View style={styles.resultBox}>
                                <Text style={styles.label}>Detected Role</Text>
                                <Text style={styles.resultRole}>{processedProfile.roleTitle}</Text>

                                <Text style={[styles.label, { marginTop: 12 }]}>Skills Extracted</Text>
                                <View style={styles.skillWrap}>
                                    {processedProfile.skills?.map((s: string, i: number) => (
                                        <View key={i} style={styles.skillBadge}>
                                            <Text style={styles.skillText}>{s}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <Text style={styles.successDesc}>Review your details before saving.</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => onComplete(processedProfile)}
                        >
                            <Text style={styles.saveButtonText}>Save & Create Profile</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    header: { position: 'absolute', top: 50, left: 0, right: 0, padding: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 12 },
    headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    closeButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },

    content: { flex: 1 },
    camera: { flex: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'flex-end', padding: 24, paddingBottom: 40 },

    questionCard: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    recordingIndicator: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444', marginRight: 8 },
    recordingPulse: { opacity: 1 },
    recordingText: { color: '#ef4444', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' },
    questionText: { color: 'white', fontWeight: 'bold', fontSize: 20, lineHeight: 28 },
    questionCounter: { color: '#a78bfa', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', marginTop: 12 },

    controls: { height: 180, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center', gap: 16, borderTopWidth: 1, borderColor: '#333' },
    recordButton: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
    recordIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ef4444' },
    stopButton: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
    stopIcon: { width: 28, height: 28, borderRadius: 4, backgroundColor: '#ef4444' },
    instructionText: { color: '#94a3b8', fontSize: 14, fontWeight: '500' },

    processingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: '#0f172a' },
    processingTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 24 },
    processingDesc: { color: '#94a3b8', textAlign: 'center', marginTop: 8 },
    debugText: { color: '#475569', fontSize: 10, marginTop: 40, fontFamily: 'monospace' },

    reviewContainer: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 },
    successCard: { backgroundColor: 'white', padding: 24, borderRadius: 32, alignItems: 'center', width: '100%', shadowColor: 'black', shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
    successTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a', marginTop: 16, marginBottom: 8 },
    successDesc: { color: '#64748b', fontSize: 14, marginBottom: 16 },

    resultBox: { width: '100%', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginVertical: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    label: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' },
    resultRole: { fontSize: 18, fontWeight: 'bold', color: '#7c3aed', marginTop: 4 },

    skillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    skillBadge: { backgroundColor: '#ede9fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    skillText: { color: '#7c3aed', fontSize: 12, fontWeight: '600' },

    saveButton: { width: '100%', backgroundColor: '#7c3aed', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 24, shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 10 },
    saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    permissionContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', padding: 32 },
    permissionTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    permissionText: { color: '#94a3b8', textAlign: 'center', marginBottom: 32, fontSize: 16 },
    permButton: { backgroundColor: '#333', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
    permButtonText: { color: 'white', fontWeight: '600' },
    cancelButton: { marginTop: 16 },
    cancelText: { color: '#ef4444', fontWeight: '600' }
});

export default VideoInterview;