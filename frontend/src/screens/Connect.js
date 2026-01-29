import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function ConnectScreen() {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Connect</Text>
                <Text style={styles.subtitle}>Join communities and network</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured Communities</Text>
                <View style={styles.communityCard}>
                    <Text style={styles.communityName}>Tech Professionals</Text>
                    <Text style={styles.communityDesc}>Connect with tech professionals</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Posts</Text>
                <View style={styles.postCard}>
                    <Text style={styles.postContent}>Welcome to HireCircle! Start networking...</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        padding: 20,
        paddingTop: 50
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
        padding: 20
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15
    },
    communityCard: {
        backgroundColor: '#f9f9f9',
        padding: 20,
        borderRadius: 12,
        marginBottom: 10
    },
    communityName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    communityDesc: {
        fontSize: 14,
        color: '#666'
    },
    postCard: {
        backgroundColor: '#f9f9f9',
        padding: 20,
        borderRadius: 12
    },
    postContent: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24
    }
});
