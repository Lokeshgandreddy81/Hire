import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../services/api';

export default function ApplicationsScreen({ navigation }) {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            const response = await api.get('/applications');
            setApplications(response.data || []);
        } catch (e) {
            console.error('Failed to load applications:', e);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'applied': return '#2196F3';
            case 'interview': return '#FF9800';
            case 'hired': return '#7B2CBF';
            case 'rejected': return '#999';
            default: return '#666';
        }
    };

    const filteredApplications = filter === 'all' 
        ? applications 
        : applications.filter(app => app.status === filter);

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
                <Text style={styles.title}>My Applications</Text>
            </View>

            <View style={styles.filters}>
                {['all', 'applied', 'interview', 'hired', 'rejected'].map(status => (
                    <TouchableOpacity
                        key={status}
                        style={[styles.filterChip, filter === status && styles.filterChipActive]}
                        onPress={() => setFilter(status)}
                    >
                        <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredApplications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => item.chat_id && navigation.navigate('Chat', { chatId: item.chat_id })}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.cardInfo}>
                                <Text style={styles.jobTitle}>{item.job_title}</Text>
                                <Text style={styles.companyName}>{item.company_name}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                                <Text style={styles.statusText}>{item.status}</Text>
                            </View>
                        </View>
                        <Text style={styles.appliedDate}>
                            Applied: {new Date(item.applied_at).toLocaleDateString()}
                        </Text>
                        {item.chat_id && (
                            <TouchableOpacity
                                style={styles.chatButton}
                                onPress={() => navigation.navigate('Chat', { chatId: item.chat_id })}
                            >
                                <Text style={styles.chatButtonText}>View Chat</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No applications found</Text>
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
    filterChipActive: {
        backgroundColor: '#7B2CBF'
    },
    filterText: {
        color: '#666',
        fontSize: 14
    },
    filterTextActive: {
        color: '#fff'
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
        marginBottom: 10
    },
    cardInfo: {
        flex: 1
    },
    jobTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    companyName: {
        fontSize: 16,
        color: '#666'
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    appliedDate: {
        fontSize: 14,
        color: '#999',
        marginBottom: 10
    },
    chatButton: {
        backgroundColor: '#7B2CBF',
        padding: 10,
        borderRadius: 8,
        alignSelf: 'flex-start'
    },
    chatButtonText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100
    },
    emptyText: {
        fontSize: 16,
        color: '#999'
    }
});
