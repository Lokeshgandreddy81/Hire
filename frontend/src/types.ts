// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export enum UserRole {
    // Aligned with Python Backend 'role' strings
    JOB_SEEKER = 'job_seeker',
    EMPLOYER = 'employer',
    ADMIN = 'admin'
}

export type ApplicationStatus = 'requested' | 'accepted' | 'applied' | 'viewed' | 'shortlisted' | 'interview' | 'rejected' | 'offer' | 'hired';

// =============================================================================
// USER & AUTH
// =============================================================================

export interface User {
    id: string;
    identifier?: string; // Phone or Email used for login
    role: UserRole;

    // Profile Fields
    name?: string;
    avatar?: string;
    location?: string;

    // Candidate Specific
    roleTitle?: string;       // e.g. "Heavy Driver"
    experienceYears?: number; // e.g. 5
    skills?: string[];

    // Employer Specific
    companyName?: string;

    // State Flags
    isNewUser?: boolean;
}

// =============================================================================
// JOBS
// =============================================================================

export interface Job {
    id: string;
    _id?: string; // MongoDB ID (backend raw)

    // Core Data
    title: string;
    company: string;         // Display name (mapped from companyName)
    companyName?: string;    // Backend field
    location: string;
    type: string;            // 'Full-time', 'Part-time', etc.
    status?: 'active' | 'closed' | 'draft';

    // Compensation
    salary: string;          // Display string: "₹20k - ₹30k"
    minSalary?: number;
    maxSalary?: number;

    // Details
    description: string;
    skills: string[];        // Display list
    requirements?: string[]; // Backend field
    experience_required?: number;

    // Metadata
    postedAt: string;        // Relative time: "2h ago"
    posted_at?: string;      // ISO Date
    matchScore?: number;     // AI Calculated (0-100)
    match_percentage?: number; // Mapped from backend in some endpoints
    application_status?: ApplicationStatus; // Injected by backend in detail view
}

// =============================================================================
// CANDIDATE PROFILES
// =============================================================================

export interface Profile {
    id: string;
    _id?: string;
    userId: string;

    // Professional Info
    roleTitle: string;       // Mapped from job_title
    job_title?: string;      // Backend field
    summary: string;
    location: string;

    // Metrics
    experienceYears: number;
    salary_expectations?: string;

    // Tags
    skills: string[];
    qualifications?: string[];

    // Preferences
    remote_work_preference?: boolean;
    isDefault?: boolean;
}

// =============================================================================
// APPLICATIONS & ACTIVITY
// =============================================================================

export interface Application {
    id: string;
    _id?: string;

    // Relationships
    jobId: string;
    employerId: string;
    candidateId: string;

    // Snapshot Data (For UI rendering without extra fetches)
    jobTitle: string;
    companyName: string;
    candidateName: string;
    candidateAvatar?: string;

    // State
    status: ApplicationStatus;
    matchScore?: number;

    // Activity
    lastMessage?: string;
    lastActivity?: string; // ISO Date
}

// =============================================================================
// MESSAGING
// =============================================================================

export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
    isSystem?: boolean;
}

export interface ChatPreview {
    id: string;
    jobId: string;
    employerId: string;
    candidateId: string;
    lastMessage?: string;
    updatedAt: string;

    // UI Helpers
    displayName?: string;
    avatar?: string;
}

// =============================================================================
// DISCOVERY
// =============================================================================

export interface TalentPool {
    id: string;
    name: string;
    count: number;
    tags: string[];
    topSkills?: string[];
    candidates?: any[]; // Populated by frontend fetch logic
}