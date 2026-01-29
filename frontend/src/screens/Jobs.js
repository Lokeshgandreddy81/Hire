import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../services/api';

export default function JobsScreen({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadJobs();
    }, []);

    const loadJobs = async () => {
        try {
            const response = await api.get('/jobs');
            setJobs(response.data || []);
        } catch (e) {
            console.error('Failed to load jobs:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadJobs();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#7B2CBF" />
                <Text style={styles.loadingText}>Finding matches...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Jobs for you</Text>
            </View>

            <View style={styles.filters}>
                {['All', 'High Match', 'New', 'Easy Apply'].map(filter => (
                    <TouchableOpacity key={filter} style={styles.filterChip}>
                        <Text style={styles.filterText}>{filter}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={jobs}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No matches yet</Text>
                        <Text style={styles.emptySubtext}>
                            Complete your profile to see job matches
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.jobTitle}>{item.title}</Text>
                                <Text style={styles.company}>{item.company}</Text>
                            </View>
                            {item.match_percentage && (
                                <View style={styles.matchBadge}>
                                    <Text style={styles.matchText}>{item.match_percentage}%</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.skillsContainer}>
                            {item.required_skills?.slice(0, 3).map((skill, idx) => (
                                <View key={idx} style={styles.skillBadge}>
                                    <Text style={styles.skillText}>{skill}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.cardFooter}>
                            <Text style={styles.location}>📍 {item.location}</Text>
                            <Text style={styles.salary}>{item.salary || 'Negotiable'}</Text>
                        </View>
                        <Text style={styles.postedTime}>
                            Posted {new Date(item.created_at || Date.now()).toLocaleDateString()}
                        </Text>
                    </TouchableOpacity>
                )}
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
    loadingText: {
        marginTop: 10,
        color: '#666'
    },
    header: {
        padding: 20,
        paddingTop: 50
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333'
    },
    filters: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#E0E0E0',
        marginRight: 8
    },
    filterText: {
        color: '#666',
        fontSize: 14
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
        alignItems: 'flex-start',
        marginBottom: 12
    },
    cardInfo: {
        flex: 1
    },
    jobTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    company: {
        fontSize: 16,
        color: '#7B2CBF'
    },
    matchBadge: {
        backgroundColor: '#7B2CBF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16
    },
    matchText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    },
    skillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12
    },
    skillBadge: {
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 6
    },
    skillText: {
        color: '#333',
        fontSize: 12
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    location: {
        fontSize: 14,
        color: '#666'
    },
    salary: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4CAF50'
    },
    postedTime: {
        fontSize: 12,
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
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center'
    }
});
