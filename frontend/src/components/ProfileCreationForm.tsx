import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { ProfileAPI } from '../services/api';
import { IconX } from './Icons';

// =============================================================================
// TYPES
// =============================================================================

interface ProfileCreationFormProps {
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // Add this
}

export default function ProfileCreationForm({ onClose, onSuccess, initialData }: ProfileCreationFormProps) {
    // Form State (initialized with props if editing)
    const [headline, setHeadline] = useState(initialData?.roleTitle || '');
    const [bio, setBio] = useState(initialData?.summary || '');
    const [location, setLocation] = useState(initialData?.location || '');
    const [experienceYears, setExperienceYears] = useState(initialData?.experienceYears?.toString() || '');
    const [hourlyRate, setHourlyRate] = useState(initialData?.salary_expectations?.replace(/[^0-9]/g, '') || '');
    const [skillsInput, setSkillsInput] = useState(initialData?.skills?.join(', ') || '');
    const [shift, setShift] = useState('');

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [errorDetail, setErrorDetail] = useState<string | null>(null);

    const handleSubmit = async () => {
        // 1. Validation (Cook Operational Discipline)
        setErrorDetail(null);
        if (!headline.trim() || !location.trim() || !skillsInput.trim()) {
            Alert.alert("Missing Fields", "Please fill in Role Name, City, and Skills.");
            return;
        }

        setIsLoading(true);

        try {
            // 2. Payload Construction (Pichai Data Integrity)
            // Backend expects specific types. We format here.
            const profileData = {
                job_title: headline.trim(),
                summary: bio.trim() || `Experienced ${headline.trim()} available for ${shift || 'flexible'} shifts in ${location.trim()}.`,
                location: location.trim(),
                experience_years: parseInt(experienceYears) || 0, // Must be int
                salary_expectations: hourlyRate ? `₹${hourlyRate}/hr` : "Negotiable", // Must be string
                skills: skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0),
                remote_work_preference: false // Default
            };



            // 3. API Call
            await ProfileAPI.createProfile(profileData);

            Alert.alert("Success", "Profile created successfully!");
            onSuccess();

        } catch (error: any) {
            // 4. Robust Error Handling
            console.error("Profile Creation Error:", error);
            const serverMsg = error.response?.data?.detail || error.message || "Unknown error occurred";
            const displayMsg = typeof serverMsg === 'object' ? JSON.stringify(serverMsg) : serverMsg;

            setErrorDetail(displayMsg);
            Alert.alert("Creation Failed", "Please check the error details on screen.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardContainer}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Create Profile</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <IconX size={24} color="#64748b" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Error Banner */}
                {errorDetail && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorTitle}>Submission Error:</Text>
                        <Text style={styles.errorText}>{errorDetail}</Text>
                    </View>
                )}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Role Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Delivery Driver, Sales Exec"
                        value={headline}
                        onChangeText={setHeadline}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>City *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Bangalore"
                        value={location}
                        onChangeText={setLocation}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Experience (Yrs)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0"
                            keyboardType="numeric"
                            value={experienceYears}
                            onChangeText={setExperienceYears}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Rate (₹/hr)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="150"
                            keyboardType="numeric"
                            value={hourlyRate}
                            onChangeText={setHourlyRate}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Skills (comma separated) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Driving, Navigation, Hindi"
                        value={skillsInput}
                        onChangeText={setSkillsInput}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Preferred Shift</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Night Shift, Flexible"
                        value={shift}
                        onChangeText={setShift}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bio / Summary</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        multiline
                        placeholder="Briefly describe your experience and availability..."
                        value={bio}
                        onChangeText={setBio}
                        textAlignVertical="top"
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.spacer} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    disabled={isLoading}
                >
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.submitText}>Save Profile</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    closeBtn: {
        padding: 4,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    errorBanner: {
        backgroundColor: '#fee2e2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#fecaca'
    },
    errorTitle: {
        color: '#b91c1c',
        fontWeight: 'bold',
        fontSize: 12,
        marginBottom: 4
    },
    errorText: {
        color: '#991b1b',
        fontSize: 12
    },
    inputGroup: {
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#475569'
    },
    input: {
        backgroundColor: '#f8fafc',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: 16,
        color: '#1e293b'
    },
    textArea: {
        minHeight: 100
    },
    row: {
        flexDirection: 'row'
    },
    spacer: {
        height: 40
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 24,
        gap: 12,
        borderTopWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: 'white'
    },
    cancelBtn: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    cancelText: {
        color: '#64748b',
        fontWeight: 'bold',
        fontSize: 16
    },
    submitBtn: {
        backgroundColor: '#7c3aed',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        minWidth: 140,
        alignItems: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: '#c4b5fd',
    },
    submitText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    }
});