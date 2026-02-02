import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Image,
    FlatList,
    Alert
} from 'react-native';
import { User, UserRole } from '../types';
import {
    IconMessageSquare,
    IconUsers,
    IconPlus,
    IconBriefcase,
    IconCheck,
    IconSearch,
    IconBell
} from '../components/Icons';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

interface ConnectTabProps {
    currentUser: User;
}

interface Post {
    id: string;
    authorName: string;
    authorRole: string;
    authorAvatar: string;
    content: string;
    timeAgo: string;
    likes: number;
    comments: number;
    hasImage?: boolean;
}

const MOCK_SUGGESTIONS = [
    { id: '1', name: 'Rahul D.', role: 'Senior Driver', mutuals: 12 },
    { id: '2', name: 'Priya S.', role: 'HR Manager', mutuals: 4 },
    { id: '3', name: 'Amit K.', role: 'Warehouse Lead', mutuals: 8 },
];

const MOCK_POSTS: Post[] = [
    {
        id: 'p1',
        authorName: 'LogiTech Solutions',
        authorRole: 'Hiring Company',
        authorAvatar: 'https://ui-avatars.com/api/?name=LogiTech&background=7c3aed&color=fff',
        content: 'We are expanding our fleet in Hyderabad! Looking for 50+ heavy vehicle drivers. Apply via the Jobs tab. 🚛 #Hiring #Logistics',
        timeAgo: '2h ago',
        likes: 124,
        comments: 45
    },
    {
        id: 'p2',
        authorName: 'Suresh Kumar',
        authorRole: 'Delivery Partner',
        authorAvatar: 'https://ui-avatars.com/api/?name=Suresh+Kumar&background=random',
        content: 'Just completed 1000 deliveries with Swiggy! Thanks to the community for the safety tips on night riding. 🌙✅',
        timeAgo: '5h ago',
        likes: 89,
        comments: 12
    },
    {
        id: 'p3',
        authorName: 'City Police',
        authorRole: 'Public Safety',
        authorAvatar: 'https://ui-avatars.com/api/?name=City+Police&background=ef4444&color=fff',
        content: 'Traffic Alert: Heavy congestion on Outer Ring Road due to maintenance. Plan your routes accordingly.',
        timeAgo: '1d ago',
        likes: 450,
        comments: 20
    }
];

// =============================================================================
// SUB-COMPONENT: SUGGESTION CARD
// =============================================================================

const SuggestionCard = ({ item }: { item: typeof MOCK_SUGGESTIONS[0] }) => {
    const [connected, setConnected] = useState(false);

    return (
        <View style={styles.suggestionCard}>
            <Image
                source={{ uri: `https://ui-avatars.com/api/?name=${item.name}&background=f1f5f9` }}
                style={styles.suggestionAvatar}
            />
            <Text style={styles.suggestionName}>{item.name}</Text>
            <Text style={styles.suggestionRole}>{item.role}</Text>
            <Text style={styles.mutuals}>{item.mutuals} mutual connections</Text>

            <Pressable
                style={[styles.connectBtn, connected && styles.connectBtnActive]}
                onPress={() => setConnected(!connected)}
            >
                {connected ? (
                    <IconCheck size={16} color="white" />
                ) : (
                    <IconPlus size={16} color="white" />
                )}
                <Text style={styles.connectBtnText}>
                    {connected ? 'Sent' : 'Connect'}
                </Text>
            </Pressable>
        </View>
    );
};

// =============================================================================
// SUB-COMPONENT: FEED POST
// =============================================================================

const FeedPost = ({ post }: { post: Post }) => (
    <View style={styles.postCard}>
        <View style={styles.postHeader}>
            <Image source={{ uri: post.authorAvatar }} style={styles.postAvatar} />
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.postAuthor}>{post.authorName}</Text>
                    {post.authorRole.includes('Company') && (
                        <IconCheck size={12} color="#3b82f6" style={{ marginLeft: 4 }} />
                    )}
                </View>
                <Text style={styles.postRole}>{post.authorRole} • {post.timeAgo}</Text>
            </View>
            <Pressable style={styles.moreBtn}>
                <Text style={{ fontSize: 18, color: '#94a3b8' }}>•••</Text>
            </Pressable>
        </View>

        <Text style={styles.postContent}>{post.content}</Text>

        <View style={styles.postStats}>
            <Text style={styles.statText}>👍 {post.likes}</Text>
            <Text style={styles.statText}>{post.comments} comments</Text>
        </View>

        <View style={styles.postActions}>
            <Pressable style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>👍 Like</Text>
            </Pressable>
            <Pressable style={styles.actionBtn}>
                <IconMessageSquare size={16} color="#64748b" />
                <Text style={styles.actionBtnText}>Comment</Text>
            </Pressable>
            <Pressable style={styles.actionBtn}>
                <IconBriefcase size={16} color="#64748b" />
                <Text style={styles.actionBtnText}>Share</Text>
            </Pressable>
        </View>
    </View>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ConnectTab({ currentUser }: ConnectTabProps) {
    const isEmployee = currentUser?.role === UserRole.EMPLOYEE;

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Community</Text>
                    <Text style={styles.subtitle}>Grow your professional network</Text>
                </View>
                <View style={styles.headerIcons}>
                    <Pressable style={styles.iconButton}>
                        <IconSearch size={20} color="#64748b" />
                    </Pressable>
                    <Pressable style={styles.iconButton}>
                        <IconBell size={20} color="#64748b" />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 1. PEOPLE YOU MAY KNOW */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>
                            {isEmployee ? 'Recommended Peers' : 'Top Talent to Watch'}
                        </Text>
                        <Pressable>
                            <Text style={styles.seeAll}>See All</Text>
                        </Pressable>
                    </View>

                    <FlatList
                        horizontal
                        data={MOCK_SUGGESTIONS}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => <SuggestionCard item={item} />}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 4 }}
                    />
                </View>

                {/* 2. NEWS FEED */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Recent Activity</Text>

                    {/* Create Post Input */}
                    <View style={styles.createPostBox}>
                        <Image source={{ uri: currentUser?.avatar }} style={styles.miniAvatar} />
                        <Pressable style={styles.fakeInput} onPress={() => Alert.alert("Coming Soon", "Posting will be enabled in v2")}>
                            <Text style={styles.fakeInputText}>Start a post...</Text>
                        </Pressable>
                    </View>

                    {MOCK_POSTS.map(post => (
                        <FeedPost key={post.id} post={post} />
                    ))}
                </View>
            </ScrollView>

            {/* FAB */}
            <Pressable
                style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
                onPress={() => Alert.alert("New Message", "Select a connection to message")}
            >
                <IconMessageSquare size={24} color="white" />
            </Pressable>
        </View>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc' // Slate-50
    },
    header: {
        padding: 24,
        paddingTop: 60, // Safe Area
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5
    },
    subtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 12
    },
    iconButton: {
        padding: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: 12
    },
    scrollContent: {
        paddingBottom: 100
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    seeAll: {
        fontSize: 13,
        fontWeight: '600',
        color: '#7c3aed'
    },

    // Suggestion Card
    suggestionCard: {
        width: 140,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        marginRight: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1
    },
    suggestionAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginBottom: 8,
        backgroundColor: '#f1f5f9'
    },
    suggestionName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
        textAlign: 'center'
    },
    suggestionRole: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 4,
        textAlign: 'center'
    },
    mutuals: {
        fontSize: 10,
        color: '#94a3b8',
        marginBottom: 12
    },
    connectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#7c3aed',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        width: '100%',
        gap: 4
    },
    connectBtnActive: {
        backgroundColor: '#10b981'
    },
    connectBtnText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: 'white'
    },

    // Post Card
    postCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 4
    },
    postHeader: {
        flexDirection: 'row',
        marginBottom: 12
    },
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#f1f5f9'
    },
    postAuthor: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    postRole: {
        fontSize: 12,
        color: '#64748b'
    },
    moreBtn: {
        padding: 4
    },
    postContent: {
        fontSize: 14,
        color: '#334155',
        lineHeight: 22,
        marginBottom: 12
    },
    postStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 12
    },
    statText: {
        fontSize: 12,
        color: '#94a3b8'
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-around'
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b'
    },

    // Create Post
    createPostBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9'
    },
    miniAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 12,
        backgroundColor: '#f1f5f9'
    },
    fakeInput: {
        flex: 1,
        height: 36,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 18,
        paddingHorizontal: 16
    },
    fakeInputText: {
        fontSize: 13,
        color: '#94a3b8'
    },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#7c3aed',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5
    },
    fabPressed: {
        transform: [{ scale: 0.95 }]
    }
});