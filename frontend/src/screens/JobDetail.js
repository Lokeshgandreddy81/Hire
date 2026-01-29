import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

export default function JobDetailScreen({ navigation, route }) {
    const { jobId } = route.params;
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        loadJob();
    }, []);

    const loadJob = async () => {
        try {
            const response = await api.get(`/jobs/${jobId}`);
            setJob(response.data);
        } catch (e) {
            Alert.alert('Error', 'Failed to load job details');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        setApplying(true);
        try {
            const response = await api.post(`/jobs/${jobId}/apply`);
            Alert.alert(
                'Application Submitted!',
                'Your application has been sent. A chat conversation has been created.',
                [
                    {
                        text: 'View Chat',
                        onPress: () => navigation.navigate('Chat', { chatId: response.data.chat_id })
                    },
                    { text: 'OK' }
                ]
            );
        } catch (e) {
            Alert.alert('Error', 'Failed to submit application');
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7B2CBF" />
            </View>
        );
    }

    if (!job) {
        return (
            <View style={styles.container}>
                <Text>Job not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>← Back</Text>
                </TouchableOpacity>
                {job.match_percentage && (
                    <View style={styles.matchBadge}>
                        <Text style={styles.matchText}>{job.match_percentage}% Match</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>{job.title}</Text>
                <TouchableOpacity>
                    <Text style={styles.company}>{job.company}</Text>
                </TouchableOpacity>

                <View style={styles.infoRow}>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Salary</Text>
                        <Text style={styles.infoValue}>{job.salary || 'Negotiable'}</Text>
                    </View>
                    <View style={styles.infoCard}>
                        <Text style={styles.infoLabel}>Type</Text>
                        <Text style={styles.infoValue}>{job.job_type || 'Full-time'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.sectionText}>{job.description}</Text>
                </View>

                {job.required_skills && job.required_skills.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Required Skills</Text>
                        <View style={styles.skillsContainer}>
                            {job.required_skills.map((skill, idx) => (
                                <View key={idx} style={styles.skillBadge}>
                                    <Text style={styles.skillText}>{skill}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {job.match_score && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Why You Match</Text>
                        <Text style={styles.sectionText}>
                            Your skills and experience align well with this position. 
                            The match score is calculated based on your profile.
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.applyButton, applying && styles.applyButtonDisabled]}
                    onPress={handleApply}
                    disabled={applying}
                >
                    <Text style={styles.applyButtonText}>
                        {applying ? 'Applying...' : 'Apply Now'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50
    },
    backButton: {
        fontSize: 18,
        color: '#7B2CBF',
        fontWeight: '600'
    },
    matchBadge: {
        backgroundColor: '#7B2CBF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16
    },
    matchText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    content: {
        padding: 20
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8
    },
    company: {
        fontSize: 18,
        color: '#7B2CBF',
        marginBottom: 20
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 30
    },
    infoCard: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 12,
        marginRight: 10
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    section: {
        marginBottom: 25
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12
    },
    sectionText: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    skillBadge: {
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 8
    },
    skillText: {
        color: '#333',
        fontSize: 14
    },
    applyButton: {
        backgroundColor: '#7B2CBF',
        padding: 18,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 40
    },
    applyButtonDisabled: {
        opacity: 0.6
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center'
    }
});
