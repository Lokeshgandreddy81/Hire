import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function RoleSelectScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Role</Text>
            <Button title="I am a Job Seeker" onPress={() => navigation.navigate('Jobs')} />
            <View style={{ height: 20 }} />
            <Button title="I am a Recruiter" onPress={() => alert('Recruiter flow not implemented in this demo path')} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40 }
});
