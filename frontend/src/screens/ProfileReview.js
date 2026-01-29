import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import api from '../services/api';

export default function ProfileReviewScreen({ navigation, route }) {
    const { profile } = route.params;
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/profiles/create', profile);
            Alert.alert(
                'Profile Created!',
                'Your profile has been saved. We\'re matching you with employers now!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Dashboard' }]
                            });
                        }
                    }
                ]
            );
        } catch (e) {
            Alert.alert('Error', 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Review Your Profile</Text>
                <Text style={styles.subtitle}>Please review and save your profile</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Job Title</Text>
                <Text style={styles.value}>{profile.job_title}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Summary</Text>
                <Text style={styles.value}>{profile.summary}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Skills</Text>
                <View style={styles.skillsContainer}>
                    {profile.skills.map((skill, idx) => (
                        <View key={idx} style={styles.skillBadge}>
                            <Text style={styles.skillText}>{skill}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Experience</Text>
                <Text style={styles.value}>{profile.experience_years} years</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>{profile.location}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.label}>Salary Expectations</Text>
                <Text style={styles.value}>{profile.salary_expectations}</Text>
            </View>

            {profile.licenses_certifications && profile.licenses_certifications.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.label}>Licenses & Certifications</Text>
                    {profile.licenses_certifications.map((cert, idx) => (
                        <Text key={idx} style={styles.value}>• {cert}</Text>
                    ))}
                </View>
            )}

            <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
            >
                <Text style={styles.saveButtonText}>
                    {saving ? 'Saving...' : 'Save Profile'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20
    },
    header: {
        marginBottom: 30,
        marginTop: 20
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: '#666'
    },
    section: {
        marginBottom: 25
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#7B2CBF',
        marginBottom: 8
    },
    value: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8
    },
    skillBadge: {
        backgroundColor: '#7B2CBF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8
    },
    skillText: {
        color: '#fff',
        fontSize: 14
    },
    saveButton: {
        backgroundColor: '#7B2CBF',
        padding: 18,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 40
    },
    saveButtonDisabled: {
        opacity: 0.6
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center'
    }
});
