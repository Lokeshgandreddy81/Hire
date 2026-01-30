import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function ProfileProcessingScreen({ navigation, route }) {
    const { transcript } = route.params;
    const [status, setStatus] = useState('Analyzing your interview...');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    const processInterview = async () => {
        setError(false);
        setLoading(true);
        setStatus('Extracting profile data...');
        try {
            const response = await api.post('/profiles/process-interview', {
                transcript
            });
            setStatus('Profile extracted successfully!');
            setTimeout(() => {
                navigation.replace('ProfileReview', {
                    profile: response.data.profile
                });
            }, 1500);
        } catch (e) {
            setLoading(false);
            setError(true);
            setStatus('Something went wrong. Please try again.');
        }
    };

    useEffect(() => {
        processInterview();
    }, []);

    return (
        <View style={styles.container}>
            {loading && <ActivityIndicator size="large" color="#7B2CBF" />}
            <Text style={styles.statusText}>{status}</Text>
            {!error ? (
                <Text style={styles.subtitle}>This may take a few moments</Text>
            ) : (
                <>
                    <TouchableOpacity style={styles.retryButton} onPress={processInterview}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.exitButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.exitButtonText}>Exit</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        padding: 20
    },
    statusText: {
        color: '#7B2CBF',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        textAlign: 'center'
    },
    subtitle: {
        color: '#999',
        fontSize: 14,
        marginTop: 10,
        textAlign: 'center'
    },
    retryButton: {
        backgroundColor: '#7B2CBF',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 24
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    exitButton: {
        paddingVertical: 12,
        marginTop: 12
    },
    exitButtonText: {
        color: '#999',
        fontSize: 16
    }
});
