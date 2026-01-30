import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function SettingsScreen({ navigation }) {
    const { logout, userInfo } = useContext(AuthContext);

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'RoleSelect' }]
                        });
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete account',
            'This will permanently delete your account and all your data. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete('/auth/account');
                            await logout();
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'RoleSelect' }]
                            });
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete account. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account Settings</Text>
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Email</Text>
                    <Text style={styles.settingValue}>{userInfo?.identifier || 'N/A'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Change Password</Text>
                    <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Privacy Settings</Text>
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Privacy Policy</Text>
                    <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Data Management</Text>
                    <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Preferences</Text>
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Notifications</Text>
                    <Text style={styles.settingArrow}>→</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Language</Text>
                    <Text style={styles.settingValue}>English</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.aboutText}>HireCircle v1.0.0</Text>
                <Text style={styles.aboutText}>Connecting talent with opportunities</Text>
            </View>

            <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
                <Text style={styles.deleteAccountButtonText}>Delete account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
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
        color: '#333'
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0'
    },
    settingLabel: {
        fontSize: 16,
        color: '#333'
    },
    settingValue: {
        fontSize: 16,
        color: '#666'
    },
    settingArrow: {
        fontSize: 18,
        color: '#999'
    },
    aboutText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8
    },
    deleteAccountButton: {
        marginHorizontal: 20,
        marginTop: 20,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E91E63'
    },
    deleteAccountButtonText: {
        color: '#E91E63',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center'
    },
    logoutButton: {
        backgroundColor: '#E91E63',
        margin: 20,
        padding: 18,
        borderRadius: 12,
        marginTop: 40
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center'
    }
});
