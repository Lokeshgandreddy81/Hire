import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function RoleSelectScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.logo}>✨ HireCircle</Text>
            <Text style={styles.title}>Select Your Role</Text>
            <TouchableOpacity 
                style={[styles.card, styles.jobSeekerCard]} 
                onPress={() => navigation.navigate('Login', { role: 'candidate' })}
            >
                <Text style={styles.cardTitle}>Job Seeker</Text>
                <Text style={styles.cardSubtitle}>Find your dream job</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.card, styles.employerCard]} 
                onPress={() => navigation.navigate('Login', { role: 'employer' })}
            >
                <Text style={styles.cardTitle}>Employer</Text>
                <Text style={styles.cardSubtitle}>Find the best talent</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        padding: 20, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#7B2CBF',
        marginBottom: 20
    },
    title: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 40,
        color: '#333'
    },
    card: {
        width: '100%',
        padding: 30,
        borderRadius: 16,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    jobSeekerCard: {
        backgroundColor: '#7B2CBF'
    },
    employerCard: {
        backgroundColor: '#E91E63'
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8
    },
    cardSubtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9
    }
});
