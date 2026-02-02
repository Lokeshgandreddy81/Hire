import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { ProfileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    IconCheck,
    IconBriefcase,
    IconMapPin,
    IconEdit,
    IconSave,
    IconX
} from '../components/Icons';

// =============================================================================
// COMPONENT
// =============================================================================

export default function ProfileReviewScreen({ navigation, route }: any) {
    // Data from AI Extraction
    const { profile: initialProfile } = route.params;
    const { updateUser } = useAuth();

    // State (Editable)
    const [profile, setProfile] = useState(initialProfile);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Handlers
    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Send to Backend
            await ProfileAPI.createProfile(profile);

            // 2. Update Local Context (Unlock App Features immediately)
            updateUser({ isNewUser: false });

            // 3. Success Feedback
            Alert.alert(
                'Profile Live! 🚀',
                'Your profile is active. We are matching you with employers now.',
                [
                    {
                        text: "Let's Go",
                        onPress: () => {
                            // Reset navigation stack to Home
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Dashboard' }] // or 'MainTab'
                            });
                        }
                    }
                ]
            );
        } catch (e: any) {
            console.error("Save Error:", e);
            Alert.alert('Save Failed', 'Could not save your profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleEdit = () => {
        setIsEditing(!isEditing);
        if (isEditing) {
            // Toast or visual cue that changes are pending save
        }
    };

    // Helper to update fields
    const updateField = (key: string, value: any) => {
        setProfile((prev: any) => ({ ...prev, [key]: value }));
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Review Profile</Text>
                    <Text style={styles.subtitle}>
                        {isEditing ? 'Tap fields to edit' : 'Confirm AI details below'}
                    </Text>
                </View>
                <TouchableOpacity onPress={toggleEdit} style={styles.editHeaderBtn}>
                    {isEditing ? (
                        <IconCheck size={20} color="#16a34a" />
                    ) : (
                        <IconEdit size={20} color="#64748b" />
                    )}
                    <Text style={[styles.editBtnText, isEditing && styles.editBtnTextActive]}>
                        {isEditing ? 'Done' : 'Edit'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Banner */}
                <View style={styles.successBanner}>
                    <IconCheck size={20} color="#15803d" />
                    <Text style={styles.successText}>AI Extraction Complete</Text>
                </View>

                {/* Card: Role & Location */}
                <View style={styles.sectionCard}>
                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <IconBriefcase size={14} color="#7c3aed" />
                            <Text style={styles.label}>Job Title</Text>
                        </View>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={profile.job_title || profile.roleTitle}
                                onChangeText={(t) => updateField('job_title', t)}
                            />
                        ) : (
                            <Text style={styles.value}>{profile.job_title || profile.roleTitle}</Text>
                        )}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.inputGroup}>
                        <View style={styles.labelRow}>
                            <IconMapPin size={14} color="#7c3aed" />
                            <Text style={styles.label}>Location</Text>
                        </View>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={profile.location}
                                onChangeText={(t) => updateField('location', t)}
                            />
                        ) : (
                            <Text style={styles.value}>{profile.location}</Text>
                        )}
                    </View>
                </View>

                {/* Card: Summary */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    {isEditing ? (
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={profile.summary}
                            onChangeText={(t) => updateField('summary', t)}
                            multiline
                        />
                    ) : (
                        <Text style={styles.bodyText}>{profile.summary}</Text>
                    )}
                </View>

                {/* Card: Skills */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Skills Detected</Text>
                    {isEditing ? (
                        <TextInput
                            style={styles.input}
                            value={Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}
                            onChangeText={(t) => updateField('skills', t.split(','))}
                            placeholder="Comma separated skills"
                        />
                    ) : (
                        <View style={styles.skillsContainer}>
                            {profile.skills.map((skill: string, idx: number) => (
                                <View key={idx} style={styles.skillBadge}>
                                    <Text style={styles.skillText}>{skill.trim()}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Card: Details */}
                <View style={styles.sectionCard}>
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Experience</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={String(profile.experience_years)}
                                    keyboardType="numeric"
                                    onChangeText={(t) => updateField('experience_years', parseInt(t) || 0)}
                                />
                            ) : (
                                <Text style={styles.value}>{profile.experience_years} Years</Text>
                            )}
                        </View>
                        <View style={{ width: 16 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>Expected Pay</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={profile.salary_expectations}
                                    onChangeText={(t) => updateField('salary_expectations', t)}
                                />
                            ) : (
                                <Text style={styles.value}>{profile.salary_expectations || "Negotiable"}</Text>
                            )}
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <IconSave size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={styles.saveButtonText}>Confirm & Save Profile</Text>
                        </>
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
    container: {
        flex: 1,
        backgroundColor: '#f8fafc', // Slate-50
    },
    header: {
        padding: 24,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0f172a',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 2
    },
    editHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        gap: 6
    },
    editBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b'
    },
    editBtnTextActive: {
        color: '#16a34a'
    },

    content: {
        padding: 20,
    },

    // Success Banner
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#dcfce7',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        gap: 8
    },
    successText: {
        color: '#166534',
        fontWeight: 'bold',
        fontSize: 13
    },

    // Cards
    sectionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 0.5
    },

    // Inputs/Display
    inputGroup: {
        marginBottom: 4
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase'
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a'
    },
    input: {
        fontSize: 16,
        color: '#0f172a',
        borderBottomWidth: 1,
        borderBottomColor: '#7c3aed',
        paddingVertical: 4,
        backgroundColor: '#faf5ff'
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top'
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16
    },
    bodyText: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 24
    },

    // Skills
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    skillBadge: {
        backgroundColor: '#f3e8ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9d5ff'
    },
    skillText: {
        color: '#7c3aed',
        fontSize: 13,
        fontWeight: '600'
    },

    row: {
        flexDirection: 'row'
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderColor: '#f1f5f9'
    },
    saveButton: {
        backgroundColor: '#7c3aed',
        paddingVertical: 18,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    saveButtonDisabled: {
        backgroundColor: '#cbd5e1',
        shadowOpacity: 0
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    }
});