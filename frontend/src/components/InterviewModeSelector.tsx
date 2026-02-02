import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { IconFile, IconVideo, IconX } from './Icons'; // Using consistent icon set

// =============================================================================
// TYPES
// =============================================================================

export type InterviewMode = 'text' | 'video';

interface InterviewModeSelectorProps {
    visible: boolean;
    onClose: () => void;
    onSelectMode: (mode: InterviewMode) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function InterviewModeSelector({ visible, onClose, onSelectMode }: InterviewModeSelectorProps) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose} // Android Back Button handler
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <TouchableWithoutFeedback>
                    <View style={styles.modal}>

                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Choose Interview Mode</Text>
                            <Pressable onPress={onClose} hitSlop={10}>
                                <IconX size={20} color="#94a3b8" />
                            </Pressable>
                        </View>

                        <Text style={styles.subtitle}>
                            How would you like to build your profile?
                        </Text>

                        {/* Option 1: Video (Preferred) */}
                        <Pressable
                            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                            onPress={() => onSelectMode('video')}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                                <IconVideo size={24} color="#7c3aed" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.optionTitle}>Video Interview</Text>
                                <Text style={styles.optionDesc}>
                                    Record short video answers. AI extracts your skills automatically.
                                </Text>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>RECOMMENDED</Text>
                                </View>
                            </View>
                        </Pressable>

                        {/* Option 2: Text */}
                        <Pressable
                            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                            onPress={() => onSelectMode('text')}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: '#F1F5F9' }]}>
                                <IconFile size={24} color="#64748b" />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.optionTitle}>Text Transcript</Text>
                                <Text style={styles.optionDesc}>
                                    Paste your resume or type your experience manually.
                                </Text>
                            </View>
                        </Pressable>

                    </View>
                </TouchableWithoutFeedback>
            </Pressable>
        </Modal>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modal: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 24
    },
    option: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'flex-start'
    },
    optionPressed: {
        backgroundColor: '#f8fafc',
        borderColor: '#cbd5e1',
        transform: [{ scale: 0.99 }]
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16
    },
    textContainer: {
        flex: 1
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4
    },
    optionDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18
    },
    badge: {
        marginTop: 8,
        backgroundColor: '#dcfce7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start'
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#166534'
    }
});