import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

export default function ProfilesScreen({ navigation }) {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            const response = await api.get('/profiles');
            setProfiles(response.data.profiles || []);
        } catch (e) {
            console.error('Failed to load profiles:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProfile = () => {
        navigation.navigate('SmartInterview');
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7B2CBF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Profiles</Text>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateProfile}>
                    <Text style={styles.createButtonText}>+ New Profile</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={profiles}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.profileTitle}>{item.job_title}</Text>
                            {item.active && (
                                <View style={styles.activeBadge}>
                                    <Text style={styles.activeText}>Active</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.profileSummary}>{item.summary}</Text>
                        <View style={styles.skillsContainer}>
                            {item.skills.slice(0, 5).map((skill, idx) => (
                                <View key={idx} style={styles.skillBadge}>
                                    <Text style={styles.skillText}>{skill}</Text>
                                </View>
                            ))}
                            {item.skills.length > 5 && (
                                <Text style={styles.moreSkills}>+{item.skills.length - 5} more</Text>
                            )}
                        </View>
                        <Text style={styles.experience}>
                            {item.experience_years} years experience • {item.location}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No profiles yet</Text>
                        <TouchableOpacity style={styles.emptyButton} onPress={handleCreateProfile}>
                            <Text style={styles.emptyButtonText}>Create Your First Profile</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333'
    },
    createButton: {
        backgroundColor: '#7B2CBF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8
    },
    createButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    card: {
        backgroundColor: '#f9f9f9',
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    profileTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1
    },
    activeBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    activeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    profileSummary: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        lineHeight: 20
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10
    },
    skillBadge: {
        backgroundColor: '#7B2CBF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6
    },
    skillText: {
        color: '#fff',
        fontSize: 12
    },
    moreSkills: {
        fontSize: 12,
        color: '#666',
        alignSelf: 'center',
        marginLeft: 4
    },
    experience: {
        fontSize: 14,
        color: '#999'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100
    },
    emptyText: {
        fontSize: 18,
        color: '#999',
        marginBottom: 20
    },
    emptyButton: {
        backgroundColor: '#7B2CBF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
});
