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
import { JobAPI } from '../services/api';
import { IconX } from './Icons';

// =============================================================================
// TYPES
// =============================================================================

interface JobCreationFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function JobCreationForm({ onClose, onSuccess }: JobCreationFormProps) {
    // Form State
    const [title, setTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [location, setLocation] = useState('');
    const [minSalary, setMinSalary] = useState('');
    const [maxSalary, setMaxSalary] = useState('');
    const [experienceRequired, setExperienceRequired] = useState('');
    const [skillsInput, setSkillsInput] = useState('');
    const [description, setDescription] = useState('');

    // UI State
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        // 1. Validation (Fail Fast)
        if (!title.trim() || !companyName.trim() || !location.trim() || !minSalary.trim()) {
            Alert.alert("Missing Fields", "Please fill in all required fields marked with *.");
            return;
        }

        const minSal = parseInt(minSalary);
        const maxSal = parseInt(maxSalary) || minSal;

        if (maxSal < minSal) {
            Alert.alert("Invalid Salary", "Max Salary cannot be less than Min Salary.");
            return;
        }

        setIsLoading(true);

        try {
            // 2. Payload Construction (Schema Alignment)
            // Matches backend: app.routes.jobs.JobCreate
            const jobData = {
                title: title.trim(),
                company: companyName.trim(), // Corrected to match Pydantic 'company'
                location: location.trim(),
                minSalary: minSal,
                maxSalary: maxSal,
                experience_required: parseInt(experienceRequired) || 0,
                skills: skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0),
                description: description.trim() || `Hiring for ${title} at ${companyName}.`,
                remote: location.toLowerCase().includes('remote'),
                status: 'active'
            };



            // 3. API Call
            await JobAPI.createJob(jobData);

            Alert.alert("Success", "Job posted successfully!");
            onSuccess();

        } catch (error: any) {
            console.error("Job Creation Failed:", error);
            const serverMsg = error.response?.data?.detail || error.message;
            // Beautify Pydantic validation errors if possible
            const displayMsg = typeof serverMsg === 'object' ? JSON.stringify(serverMsg) : serverMsg;
            Alert.alert("Submission Failed", displayMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardContainer}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Post a New Job</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <IconX size={24} color="#64748b" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Job Title *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Senior Warehouse Manager"
                        value={title}
                        onChangeText={setTitle}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Company Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Global Logistics Inc."
                        value={companyName}
                        onChangeText={setCompanyName}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Location *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Mumbai, India (or Remote)"
                        value={location}
                        onChangeText={setLocation}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Min Salary (₹) *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="25000"
                            keyboardType="numeric"
                            value={minSalary}
                            onChangeText={setMinSalary}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Max Salary (₹)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="40000"
                            keyboardType="numeric"
                            value={maxSalary}
                            onChangeText={setMaxSalary}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Experience Required (Years)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={experienceRequired}
                        onChangeText={setExperienceRequired}
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Skills & Requirements</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Forklift Driving, Inventory Management, Hindi"
                        value={skillsInput}
                        onChangeText={setSkillsInput}
                        placeholderTextColor="#94a3b8"
                    />
                    <Text style={styles.hint}>Separate skills with commas</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Briefly describe the role..."
                        value={description}
                        onChangeText={setDescription}
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.spacer} />
            </ScrollView>

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
                        <Text style={styles.submitText}>Post Job</Text>
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
    inputGroup: {
        marginBottom: 20
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
        color: '#1e293b',
    },
    textArea: {
        minHeight: 100,
    },
    hint: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 6,
        fontStyle: 'italic',
    },
    row: {
        flexDirection: 'row'
    },
    spacer: {
        height: 40,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 24,
        gap: 12,
        borderTopWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: 'white',
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