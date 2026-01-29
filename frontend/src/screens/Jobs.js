import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button } from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function JobsScreen() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const { logout } = useContext(AuthContext);

    useEffect(() => {
        api.get('/jobs')
            .then(res => setJobs(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Available Jobs</Text>
                <Button title="Logout" onPress={logout} />
            </View>
            <FlatList
                data={jobs}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text>No jobs found.</Text>}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.jobTitle}>{item.title}</Text>
                        <Text>{item.company} - {item.location}</Text>
                        <Text style={styles.salary}>{item.salary}</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold' },
    card: { padding: 15, backgroundColor: '#f9f9f9', marginBottom: 10, borderRadius: 8 },
    jobTitle: { fontSize: 18, fontWeight: 'bold' },
    salary: { color: 'green', marginTop: 5 }
});
