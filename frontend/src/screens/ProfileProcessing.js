import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import api from '../services/api';

export default function ProfileProcessingScreen({ navigation, route }) {
    const { transcript } = route.params;
    const [status, setStatus] = useState('Analyzing your interview...');

    useEffect(() => {
        processInterview();
    }, []);

    const processInterview = async () => {
        try {
            setStatus('Extracting profile data...');
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
            console.error(e);
            setStatus('Something went wrong. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#7B2CBF" />
            <Text style={styles.statusText}>{status}</Text>
            <Text style={styles.subtitle}>This may take a few moments</Text>
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
    }
});
