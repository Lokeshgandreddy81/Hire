/**
 * GEMINI SERVICE (Frontend Simulation Layer)
 * * In a full production environment, these functions would call your Python Backend 
 * (which holds the API Keys). 
 * * For this "Production-Ready MVP", we implement "Smart Heuristics" here. 
 * This makes the app feel intelligent and responsive immediately, 
 * without requiring the backend AI endpoints to be fully configured yet.
 */

// =============================================================================
// UTILITIES
// =============================================================================

const simulateNetworkDelay = async (min = 800, max = 1500) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
};

const extractKeywords = (text: string): string[] => {
    if (!text) return [];
    const stopwords = new Set(['the', 'and', 'is', 'in', 'to', 'for', 'with', 'a', 'of']);
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopwords.has(w));
};

// =============================================================================
// SERVICE METHODS
// =============================================================================

/**
 * Analyzes the match between a Job and a Candidate.
 * Uses keyword overlap analysis to generate a dynamic explanation.
 */
export const generateMatchExplanation = async (
    jobDescription: string,
    candidateProfile: string
): Promise<string> => {
    await simulateNetworkDelay();

    const jobKeywords = new Set(extractKeywords(jobDescription));
    const profileKeywords = extractKeywords(candidateProfile);

    // Find overlaps
    const matches = profileKeywords.filter(k => jobKeywords.has(k));
    const matchCount = matches.length;
    const uniqueMatches = Array.from(new Set(matches)).slice(0, 3); // Top 3 matching skills

    if (matchCount > 3) {
        return `Strong Match! The candidate mentions key requirements like "${uniqueMatches.join(', ')}", which align perfectly with the job description. Experience levels appear consistent.`;
    } else if (matchCount > 0) {
        return `Potential Match. There is overlap in "${uniqueMatches.join(', ')}", but the candidate may need training in other specific requirements mentioned in the job post.`;
    } else {
        return "Low Match Detected. The candidate's profile focuses on different skills than what is prioritized in this job description. Consider reviewing transferrable skills.";
    }
};

/**
 * Simulates extracting a profile from a text transcript.
 * Uses Regex to identify roles and years of experience.
 */
export const generateProfileFromTranscript = async (transcript: string): Promise<any> => {
    await simulateNetworkDelay(1500, 2500);

    const lowerText = transcript.toLowerCase();

    // Heuristic Role Detection
    let roleTitle = "General Staff";
    if (lowerText.includes("drive") || lowerText.includes("driver")) roleTitle = "Driver";
    else if (lowerText.includes("cook") || lowerText.includes("chef")) roleTitle = "Cook";
    else if (lowerText.includes("sales") || lowerText.includes("market")) roleTitle = "Sales Executive";
    else if (lowerText.includes("code") || lowerText.includes("developer")) roleTitle = "Developer";

    // Heuristic Experience Detection
    const expMatch = lowerText.match(/(\d+)\s+(?:year|yr)/);
    const experienceYears = expMatch ? parseInt(expMatch[1]) : 1;

    return {
        roleTitle,
        summary: `Automated Profile: ${roleTitle} with ~${experienceYears} years of experience based on interview transcript.`,
        skills: ["Communication", "Reliability", roleTitle],
        experienceYears,
        location: "Detected from Resume"
    };
};

/**
 * Mock result for the Video Interview process.
 * In production, this would be replaced by the backend response.
 */
export const processInterview = async (answers: { question: string, answer: string }[]): Promise<any> => {
    await simulateNetworkDelay(2000, 3000); // Longer delay for "Video Processing"

    return {
        roleTitle: "Professional Candidate",
        summary: "Candidate demonstrates strong communication skills and clear intent. Responses indicate readiness for immediate deployment.",
        skills: ["Verbal Communication", "Professionalism", "Adaptability"],
        experienceYears: 3,
        qualifications: ["Verified Identity"]
    };
};

/**
 * Generates smart reply suggestions for the Chat interface.
 */
export const getChatReplySuggestion = async (
    history: string[],
    lastMessage: string,
    role: 'employer' | 'candidate'
): Promise<string> => {
    await simulateNetworkDelay(400, 800);

    const msg = lastMessage.toLowerCase();

    if (role === 'employer') {
        if (msg.includes("available") || msg.includes("interested")) {
            return "Great! Can you come for an interview tomorrow at 10 AM?";
        }
        if (msg.includes("salary") || msg.includes("pay")) {
            return "The salary range is fixed, but we offer performance bonuses. Does that work?";
        }
        return "Thanks for applying. Could you share your phone number?";
    }

    // Candidate Responses
    else {
        if (msg.includes("interview") || msg.includes("meet")) {
            return "Yes, I am available. Can you send the location?";
        }
        if (msg.includes("resume") || msg.includes("cv")) {
            return "I have updated my profile with my latest experience. Please take a look.";
        }
        return "I am very interested in this role. When can we discuss further?";
    }
};