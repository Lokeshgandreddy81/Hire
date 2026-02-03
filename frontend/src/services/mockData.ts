import { Job, Application, User, UserRole, Profile, TalentPool } from '../types';

// =============================================================================
// MOCK USERS
// =============================================================================

export const CURRENT_USER_EMPLOYEE: User = {
    id: 'u1',
    name: 'Rajesh Kumar',
    role: UserRole.JOB_SEEKER,
    roleTitle: 'Heavy Vehicle Driver', // Added for UI display
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=200&h=200',
    location: 'Hyderabad',
    skills: ['Heavy License', 'Night Shift', 'Route Knowledge'],
    experienceYears: 10
};

export const CURRENT_USER_EMPLOYER: User = {
    id: 'u2',
    name: 'Sarah Jenkins',
    role: UserRole.EMPLOYER,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&w=200&h=200',
    companyName: 'LogiTech Solutions',
    location: 'Mumbai'
};

// =============================================================================
// MOCK JOBS (Feed Data)
// =============================================================================

export const MOCK_JOBS: Job[] = [
    {
        id: 'j1',
        title: 'Senior Heavy Vehicle Driver',
        company: 'LogiTech Solutions',
        location: 'Hyderabad, Telangana',
        salary: '₹25,000 - ₹35,000',
        type: 'Full-time',
        postedAt: '2h ago',
        description: 'Looking for experienced heavy vehicle drivers for inter-city logistics. Must have valid heavy license (HMV) and 5+ years experience on South India routes.',
        skills: ['Heavy License', 'Night Shift', 'Route Knowledge', 'Safety'],
        matchScore: 92, // High match for Rajesh
        requirements: ['Valid HMV License', '5+ Years Experience', 'Clean Record']
    },
    {
        id: 'j2',
        title: 'Warehouse Supervisor',
        company: 'Amazon Delivers',
        location: 'Secunderabad',
        salary: '₹35,000',
        type: 'Full-time',
        postedAt: '1d ago',
        description: 'Manage incoming inventory and supervise loading dock staff. Requires basic computer skills.',
        skills: ['Team Management', 'Inventory', 'Excel'],
        matchScore: 65, // Moderate match
        requirements: ['Graduate', 'Computer Skills']
    },
    {
        id: 'j3',
        title: 'Delivery Partner',
        company: 'Swiggy',
        location: 'Gachibowli',
        salary: '₹18,000 + Incentives',
        type: 'Part-time',
        postedAt: '4h ago',
        description: 'Bike delivery partners needed. Flexible shifts. Instant payout options available.',
        skills: ['Two Wheeler', 'Smartphone', 'Navigation'],
        matchScore: 88,
        requirements: ['Own Bike', 'DL', 'Android Phone']
    },
    {
        id: 'j4',
        title: 'Corporate Chauffeur',
        company: 'Uber Premium',
        location: 'Banjara Hills',
        salary: '₹30,000',
        type: 'Contract',
        postedAt: 'Just now',
        description: 'Chauffeur needed for luxury fleet. Must speak basic English and have experience with automatic cars.',
        skills: ['English', 'Automatic Driving', 'Grooming'],
        matchScore: 78,
        requirements: ['Uniform', 'English Speaking']
    }
];

// =============================================================================
// MOCK APPLICATIONS (Activity Tab)
// =============================================================================

export const MOCK_APPLICATIONS: Application[] = [
    {
        id: 'a1',
        jobId: 'j1',
        candidateId: 'u1',
        employerId: 'u2',
        status: 'interview',
        lastMessage: 'Great, see you tomorrow at 10 AM at the depot.',
        lastActivity: new Date().toISOString(), // Today
        jobTitle: 'Heavy Vehicle Driver',
        companyName: 'LogiTech Solutions',
        candidateName: 'Rajesh Kumar',
        matchScore: 92
    },
    {
        id: 'a2',
        jobId: 'j3',
        candidateId: 'u1',
        employerId: 'u3',
        status: 'applied',
        lastMessage: 'Application sent successfully. Waiting for review.',
        lastActivity: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        jobTitle: 'Delivery Partner',
        companyName: 'Swiggy',
        candidateName: 'Rajesh Kumar',
        matchScore: 88
    },
    {
        id: 'a3',
        jobId: 'j4',
        candidateId: 'u1',
        employerId: 'u4',
        status: 'rejected',
        lastMessage: 'Position closed.',
        lastActivity: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        jobTitle: 'Office Driver',
        companyName: 'Tech Corp',
        candidateName: 'Rajesh Kumar',
        matchScore: 45
    }
];

// =============================================================================
// MOCK PROFILES (Candidate Data)
// =============================================================================

export const MOCK_PROFILES: Profile[] = [
    {
        id: 'p1',
        userId: 'u1',
        roleTitle: 'Heavy Driver',
        summary: '10 years of experience driving heavy trucks across South India. Specializing in long-haul routes with an impeccable safety record. Expert in fuel-efficient driving techniques.',
        experienceYears: 10,
        skills: ['Heavy License', 'Highway Driving', 'Basic Mechanics', 'Route Optimization'],
        qualifications: ['ITI Mechanical Certification', 'HMV Licensed Driver', 'First Aid Certified'],
        location: 'Hyderabad',
        salary_expectations: '₹30,000/mo',
        isDefault: true
    },
    {
        id: 'p2',
        userId: 'u1',
        roleTitle: 'Private Chauffeur',
        summary: 'Polite and punctual driver for luxury cars with 4 years of experience serving high-profile clients.',
        experienceYears: 4,
        skills: ['English', 'Automatic Transmission', 'Navigation', 'Client Relations'],
        qualifications: ['LMV License', 'Defensive Driving Certificate'],
        location: 'Hyderabad',
        salary_expectations: '₹25,000/mo',
        isDefault: false
    }
];

// =============================================================================
// MOCK TALENT POOLS (Employer View)
// =============================================================================

export const MOCK_POOLS: TalentPool[] = [
    {
        id: 'tp1',
        name: 'Drivers - Hyderabad',
        count: 142,
        tags: ['Heavy', 'Light', 'Ola/Uber'],
        topSkills: ['Driving', 'Navigation']
    },
    {
        id: 'tp2',
        name: 'Electricians - Cyberabad',
        count: 45,
        tags: ['Industrial', 'Residential'],
        topSkills: ['Wiring', 'Safety']
    },
    {
        id: 'tp3',
        name: 'Warehouse Staff',
        count: 89,
        tags: ['Night Shift', 'Loading'],
        topSkills: ['Inventory', 'Heavy Lifting']
    }
];