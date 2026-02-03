import {
    Briefcase,
    MessageSquare,
    Users,
    Settings,
    Globe,
    Mic,
    Camera,
    Send,
    Check,
    X,
    Sparkles,
    Share2,
    Clock,
    Plus,
    Image,
    Search,
    Bell,
    Award,
    BookOpen,
    FileText,
    MapPin,
    Video,
    Phone,
    Lock,
    ArrowLeft,
    AlertCircle,
    Edit,
    Save,
    ArrowRight,
    User,
    LogOut,
    Trash2,
    LucideProps
} from 'lucide-react-native';

// =============================================================================
// TYPES
// =============================================================================
// Exporting this allows other components to type their icon props correctly
export type IconProps = LucideProps;

// =============================================================================
// ICONS EXPORT
// =============================================================================

// Navigation & Core UI
export const IconBriefcase = Briefcase;
export const IconMessageSquare = MessageSquare;
export const IconUsers = Users;
export const IconSettings = Settings;
export const IconGlobe = Globe;
export const IconSearch = Search;
export const IconBell = Bell;

// Actions & Input
export const IconMic = Mic;
export const IconCamera = Camera;
export const IconSend = Send;
export const IconPlus = Plus;
export const IconImage = Image;
export const IconVideo = Video;
export const IconShare = Share2;
export const IconPhone = Phone;
export const IconLock = Lock;

// Feedback & Status
export const IconCheck = Check;
export const IconX = X;
export const IconSparkles = Sparkles; // Used for AI features

// Metadata & Details
export const IconAward = Award;
export const IconBookOpen = BookOpen;
export const IconFile = FileText;
export const IconMapPin = MapPin;
export const IconClock = Clock;
export const IconArrowLeft = ArrowLeft;

// Settings & Account
export const IconAlertCircle = AlertCircle;
export const IconEdit = Edit;
export const IconSave = Save;
export const IconArrowRight = ArrowRight;
export const IconUser = User;
export const IconLogOut = LogOut;
export const IconTrash = Trash2;