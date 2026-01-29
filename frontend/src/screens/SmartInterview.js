import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import api from '../services/api';

const QUESTIONS = [
    "Tell us about yourself and your professional background.",
    "What are your key skills and areas of expertise?",
    "What type of role are you looking for and why?",
    "What are your salary expectations and work preferences?"
];

export default function SmartInterviewScreen({ navigation, route }) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [responses, setResponses] = useState([]);
    const [hasPermission, setHasPermission] = useState(true);
    const cameraRef = useRef(null);

    const startRecording = () => {
        setIsRecording(true);
        // In production, start actual video recording
    };

    const stopRecording = () => {
        setIsRecording(false);
        // In production, stop recording and save
    };

    const handleNext = () => {
        // Save current response
        if (isRecording) {
            stopRecording();
        }
        // Simulate response (in production, use actual transcription)
        const response = `Response to question ${currentQuestion + 1}: ${QUESTIONS[currentQuestion]}`;
        setResponses([...responses, response]);
        
        if (currentQuestion < QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // All questions answered, process interview
            processInterview();
        }
    };

    const processInterview = async () => {
        // Simulate transcript (in production, use actual transcription)
        const transcript = responses.length > 0 
            ? responses.join(' ') 
            : "I am an experienced professional with strong technical skills. " +
              "I have 5 years of experience in software development. " +
              "I'm looking for a senior developer role with remote work options. " +
              "My salary expectation is competitive and negotiable.";

        navigation.navigate('ProfileProcessing', { transcript });
    };

    return (
        <View style={styles.container}>
            <View style={styles.cameraContainer}>
                <View style={styles.cameraPlaceholder}>
                    <Text style={styles.cameraPlaceholderText}>📹 Camera View</Text>
                    <Text style={styles.cameraPlaceholderSubtext}>Video recording will appear here</Text>
                </View>
            </View>
            <View style={styles.overlay}>
                <Text style={styles.questionCounter}>
                    Question {currentQuestion + 1} of {QUESTIONS.length}
                </Text>
                <Text style={styles.question}>{QUESTIONS[currentQuestion]}</Text>
                <TouchableOpacity
                    style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                    onPress={isRecording ? stopRecording : startRecording}
                >
                    <Text style={styles.recordButtonText}>
                        {isRecording ? 'STOP RECORDING' : 'START RECORDING'}
                    </Text>
                </TouchableOpacity>
                {currentQuestion < QUESTIONS.length - 1 && (
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>Next Question</Text>
                    </TouchableOpacity>
                )}
                {currentQuestion === QUESTIONS.length - 1 && (
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Text style={styles.nextButtonText}>Complete Interview</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000'
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center'
    },
    cameraPlaceholder: {
        alignItems: 'center'
    },
    cameraPlaceholderText: {
        fontSize: 48,
        marginBottom: 10
    },
    cameraPlaceholderSubtext: {
        color: '#fff',
        fontSize: 16
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 20,
        paddingBottom: 40
    },
    questionCounter: {
        color: '#fff',
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'center'
    },
    question: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    recordButton: {
        backgroundColor: '#7B2CBF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10
    },
    recordButtonActive: {
        backgroundColor: '#E91E63'
    },
    recordButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16
    },
    nextButton: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8
    },
    nextButtonText: {
        color: '#7B2CBF',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16
    }
});
