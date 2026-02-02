import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Platform } from 'react-native';

// =============================================================================
// TYPES
// =============================================================================

interface Props {
    children: ReactNode;
    /** Optional: Custom UI to show when error occurs */
    fallback?: ReactNode;
    /** Optional: Function to call when "Try Again" is pressed (e.g., clear cache/state) */
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

// =============================================================================
// COMPONENT
// =============================================================================

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to your crash reporting service (Sentry, Crashlytics, etc.)
        console.error("🔥 CRITICAL UI CRASH:", error, errorInfo);

        this.setState({
            error,
            errorInfo
        });
    }

    private handleReset = () => {
        // 1. Execute external cleanup if provided (e.g., Redux reset)
        if (this.props.onReset) {
            this.props.onReset();
        }

        // 2. Reset internal state to attempt re-render
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    public render() {
        if (this.state.hasError) {
            // Option A: Custom Fallback (if provided)
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Option B: Standard Production Fallback UI
            return (
                <SafeAreaView style={styles.container}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.emoji}>😓</Text>
                        </View>

                        <Text style={styles.title}>Oops! Something went wrong.</Text>
                        <Text style={styles.subtitle}>
                            We encountered an unexpected issue. We've been notified and are fixing it.
                        </Text>

                        {/* DEV ONLY: Show Stack Trace */}
                        {__DEV__ && this.state.error && (
                            <View style={styles.debugBox}>
                                <Text style={styles.debugTitle}>ERROR DETAILS (DEV ONLY):</Text>
                                <Text style={styles.debugText}>
                                    {this.state.error.toString()}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={this.handleReset}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#F3E8FF', // Light purple
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emoji: {
        fontSize: 48,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
        maxWidth: 300,
    },
    button: {
        backgroundColor: '#7c3aed', // Purple primary
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        width: '100%',
        maxWidth: 250,
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    debugBox: {
        width: '100%',
        backgroundColor: '#fee2e2', // Light red
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    debugTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#b91c1c',
        marginBottom: 4,
    },
    debugText: {
        fontSize: 12,
        color: '#991b1b',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    }
});