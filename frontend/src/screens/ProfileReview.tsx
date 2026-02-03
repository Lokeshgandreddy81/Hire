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
    const [isSuccess, setIsSuccess] = useState(false);

    // Handlers
    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Send to Backend
            await ProfileAPI.createProfile(profile);

            // 2. Update Local Context
            updateUser({ isNewUser: false });

            // 3. Show Success State (No Alert)
            setIsSuccess(true);

            // Auto navigate after small delay or let user tap "Continue"
            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Dashboard' }]
                });
            }, 1500);

        } catch (e: any) {
            console.error("Save Error:", e);
            Alert.alert('Save Failed', 'Could not save your profile. Please check connection.');
        } finally {
            setSaving(false);
        }
    };

    const toggleEdit = () => {
        setIsEditing(!isEditing);
    };

    // Helper to update fields
    const updateField = (key: string, value: any) => {
        setProfile((prev: any) => ({ ...prev, [key]: value }));
    };

    if (isSuccess) {
        return (
            <View style={[styles.container, styles.centerAll]}>
                <View style={styles.successCircle}>
                    <IconCheck size={48} color="white" />
                </View>
                <Text style={styles.BigSuccessTitle}>All Set!</Text>
                <Text style={styles.BigSuccessSub}>Your profile is live.</Text>
            </View>
        );
    }

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
                        {isEditing ? 'Tap below to edit' : 'Confirm details to finish'}
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
                    <Text style={styles.successText}>Profile Ready</Text>
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
        fontSize: 16,
        color: '#64748b',
        marginTop: 4
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
        fontSize: 14,
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
        backgroundColor: '#f0fdf4', // Green-50
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        gap: 12
    },
    successText: {
        color: '#15803d',
        fontWeight: '700',
        fontSize: 15
    },

    // Cards
    sectionCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
        marginBottom: 16,
        letterSpacing: 1
    },

    // Inputs/Display
    inputGroup: {
        marginBottom: 4
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    value: {
        fontSize: 18,
        fontWeight: '600',
        color: '#0f172a',
        lineHeight: 26
    },
    input: {
        fontSize: 18,
        color: '#0f172a',
        borderBottomWidth: 1,
        borderBottomColor: '#7c3aed',
        paddingVertical: 8,
        backgroundColor: '#faf5ff' // Subtle highlighted bg for edit mode
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 16,
        lineHeight: 24
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 20
    },
    bodyText: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 26
    },

    // Skills
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    skillBadge: {
        backgroundColor: '#f3e8ff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#e9d5ff'
    },
    skillText: {
        color: '#7c3aed',
        fontSize: 14,
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
        paddingVertical: 20,
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
    },

    // Success State
    centerAll: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    successCircle: {
        width: 80, height: 80,
        borderRadius: 40,
        backgroundColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#22c55e',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 }
    },
    BigSuccessTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0f172a',
        marginBottom: 8
    },
    BigSuccessSub: {
        fontSize: 18,
        color: '#64748b'
    }
});