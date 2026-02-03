import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    SafeAreaView
} from 'react-native';
import { processInterview } from '../services/geminiService'; // Use the heuristic service we built
import { IconSparkles, IconAlertCircle, IconCheck } from '../components/Icons';

// =============================================================================
// CONFIGURATION
// =============================================================================

const LOADING_MESSAGES = [
    "Uploading audio...",
    "Transcribing interview...",
    "Analyzing soft skills...",
    "Extracting technical experience...",
    "Drafting your profile..."
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function ProfileProcessingScreen({ navigation, route }: any) {
    const { transcript, audioUri } = route.params || {};

    // State
    const [msgIndex, setMsgIndex] = useState(0);
    const [error, setError] = useState < string | null > (null);
    const [isComplete, setIsComplete] = useState(false);

    // Animation Refs
    const spinValue = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // 1. Animation Loop
    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    // 2. Message Cycling (To keep user engaged)
    useEffect(() => {
        if (error || isComplete) return;

        const interval = setInterval(() => {
            setMsgIndex(prev => {
                if (prev < LOADING_MESSAGES.length - 1) return prev + 1;
                return prev; // Stay on last message
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [error, isComplete]);

    // 3. Core Logic
    useEffect(() => {
        runAIAnalysis();
    }, []);

    const runAIAnalysis = async () => {
        setError(null);
        try {
            // A. Prepare Data (Simulate API payload)
            // In a real app, you might upload 'audioUri' to S3 here first.

            // B. Call AI Service
            // We use the 'processInterview' from geminiService which has built-in heuristics
            // and simulates network latency.
            const profileData = await processInterview([
                { question: "Intro", answer: transcript || "Audio file provided" }
            ]);

            // C. Success State
            setIsComplete(true);

            // D. Navigate (Delay slightly for UX smoothness)
            setTimeout(() => {
                // Determine where to go next. Usually to a "Review" screen or back to Profile Tab
                // We pass the extracted data to populate the form
                navigation.replace('ProfileCreationForm', {
                    prefillData: profileData
                });

                // Alternatively, if using the SmartInterview modal flow:
                // route.params?.onComplete?.(profileData);
            }, 1000);

        } catch (e) {
            console.error("Processing Error:", e);
            setError("We couldn't analyze the interview. Please try again or fill the form manually.");
        }
    };

    // =========================================================================
    // RENDER
    // =========================================================================

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>

                {/* ICON / SPINNER */}
                <View style={styles.iconContainer}>
                    {error ? (
                        <View style={[styles.iconCircle, styles.errorCircle]}>
                            <IconAlertCircle size={48} color="#ef4444" />
                        </View>
                    ) : isComplete ? (
                        <View style={[styles.iconCircle, styles.successCircle]}>
                            <IconCheck size={48} color="#10b981" />
                        </View>
                    ) : (
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <View style={styles.iconCircle}>
                                <IconSparkles size={40} color="#7c3aed" />
                            </View>
                        </Animated.View>
                    )}
                </View>

                {/* STATUS TEXT */}
                <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
                    <Text style={styles.title}>
                        {error ? "Analysis Failed" : isComplete ? "Success!" : "AI is working..."}
                    </Text>

                    <Text style={styles.subtitle}>
                        {error || LOADING_MESSAGES[msgIndex]}
                    </Text>
                </Animated.View>

                {/* ERROR ACTIONS */}
                {error && (
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={runAIAnalysis}
                        >
                            <Text style={styles.primaryBtnText}>Try Again</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.secondaryBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        marginBottom: 40,
        height: 100,
        justifyContent: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f3e8ff', // Light purple
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#d8b4fe',
    },
    successCircle: {
        backgroundColor: '#dcfce7',
        borderColor: '#86efac',
    },
    errorCircle: {
        backgroundColor: '#fee2e2',
        borderColor: '#fca5a5',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 24,
        minHeight: 48, // Prevent layout jump when text changes
    },
    actionContainer: {
        marginTop: 40,
        width: '100%',
        gap: 16,
    },
    primaryBtn: {
        backgroundColor: '#7c3aed',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    primaryBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    secondaryBtn: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryBtnText: {
        color: '#64748b',
        fontWeight: '600',
        fontSize: 16,
    },
});