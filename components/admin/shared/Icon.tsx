import {
  BookOpen,
  Star,
  Mail,
  Bookmark,
  FileText,
  File,
  Calendar,
  Target,
  Image,
  TrendingUp,
  Search,
  Pencil,
  Check,
  Lock,
  BarChart3,
  RefreshCw,
  Users,
  Clock,
  CornerDownLeft,
  Monitor,
  Smartphone,
  Tablet,
  LayoutDashboard,
  Activity,
  Megaphone,
  Settings,
  ShieldCheck,
  Database,
  Zap,
  Bell,
  ClipboardList,
  CircleDollarSign,
  Package,
  HelpCircle,
  Send,
  List,
  FormInput,
  Layout,
  Workflow,
  MessageSquare,
  Eye,
  Trash2,
  Plus,
  Edit,
  Copy,
  Download,
  Upload,
  Filter,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Menu,
  LogOut,
  Home,
  Newspaper,
  Video,
  Headphones,
  Layers,
  Tags,
  Globe,
  MailOpen,
  UserCheck,
  UserPlus,
  CreditCard,
  Receipt,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

// Icon mapping from emoji/string keys to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  // Content icons
  'book': BookOpen,
  'books': BookOpen,
  'article': FileText,
  'post': FileText,
  'page': File,
  'file': File,
  'document': FileText,
  'media': Image,
  'image': Image,
  'video': Video,
  'podcast': Headphones,
  'calendar': Calendar,
  'newspaper': Newspaper,
  
  // Metrics & Analytics
  'chart': BarChart3,
  'analytics': BarChart3,
  'trending': TrendingUp,
  'target': Target,
  'stats': TrendingUp,
  
  // Users & Members
  'users': Users,
  'user': Users,
  'members': Users,
  'star': Star,
  'subscriber': UserCheck,
  
  // Communication
  'email': Mail,
  'mail': Mail,
  'newsletter': MailOpen,
  'send': Send,
  'message': MessageSquare,
  'bell': Bell,
  'notification': Bell,
  'megaphone': Megaphone,
  'announcement': Megaphone,
  
  // Actions
  'edit': Edit,
  'pencil': Pencil,
  'write': Pencil,
  'delete': Trash2,
  'trash': Trash2,
  'plus': Plus,
  'add': Plus,
  'copy': Copy,
  'download': Download,
  'upload': Upload,
  'refresh': RefreshCw,
  'search': Search,
  'filter': Filter,
  'view': Eye,
  'eye': Eye,
  
  // Status
  'check': Check,
  'success': Check,
  'lock': Lock,
  'security': ShieldCheck,
  'shield': ShieldCheck,
  'warning': AlertTriangle,
  'alert': AlertTriangle,
  
  // Navigation
  'home': Home,
  'dashboard': LayoutDashboard,
  'menu': Menu,
  'close': X,
  'logout': LogOut,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  
  // CRM & Business
  'contacts': Users,
  'deals': Briefcase,
  'tasks': ClipboardList,
  'clipboard': ClipboardList,
  'workflow': Workflow,
  'automation': Zap,
  'form': FormInput,
  'list': List,
  'layout': Layout,
  'landing-page': Layout,
  
  // Commerce
  'order': Package,
  'package': Package,
  'payment': CreditCard,
  'card': CreditCard,
  'receipt': Receipt,
  'refund': CornerDownLeft,
  'money': CircleDollarSign,
  'revenue': CircleDollarSign,
  
  // Categories & Organization
  'category': Layers,
  'categories': Layers,
  'tag': Tags,
  'tags': Tags,
  
  // Technical
  'database': Database,
  'settings': Settings,
  'globe': Globe,
  'activity': Activity,
  'zap': Zap,
  'bolt': Zap,
  'help': HelpCircle,
  
  // Devices
  'desktop': Monitor,
  'mobile': Smartphone,
  'tablet': Tablet,
  'clock': Clock,
  'time': Clock,
  
  // Special
  'bookmark': Bookmark,
  'sparkle': Sparkles,
  'sparkles': Sparkles,
  'coaching': GraduationCap,
  'course': GraduationCap,
};

// Emoji to icon key mapping for backward compatibility
const emojiToKey: Record<string, string> = {
  '📚': 'books',
  '⭐': 'star',
  '📧': 'email',
  '🔖': 'bookmark',
  '📝': 'edit',
  '📄': 'page',
  '📅': 'calendar',
  '🎯': 'target',
  '🖼️': 'media',
  '📈': 'trending',
  '🔍': 'search',
  '✏️': 'pencil',
  '✅': 'check',
  '🔒': 'lock',
  '📊': 'chart',
  '🔄': 'refresh',
  '👥': 'users',
  '⏱️': 'clock',
  '↩️': 'refund',
  '🏠': 'home',
  '🔔': 'bell',
  '📋': 'clipboard',
  '💳': 'payment',
  '⚡': 'bolt',
  '🎨': 'sparkle',
  '💼': 'deals',
  '🎓': 'coaching',
  '✨': 'sparkles',
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

export default function Icon({ 
  name, 
  size = 20, 
  className = '', 
  color,
  strokeWidth = 2 
}: IconProps) {
  // Check if input is an emoji and convert to key
  const iconKey = emojiToKey[name] || name.toLowerCase();
  const IconComponent = iconMap[iconKey];
  
  if (!IconComponent) {
    // Fallback: return the original text if no icon mapping exists
    return <span className={className}>{name}</span>;
  }
  
  return (
    <IconComponent 
      size={size} 
      className={className} 
      color={color}
      strokeWidth={strokeWidth}
    />
  );
}

// Export individual icons for direct use
export {
  BookOpen,
  Star,
  Mail,
  Bookmark,
  FileText,
  File,
  Calendar,
  Target,
  Image,
  TrendingUp,
  Search,
  Pencil,
  Check,
  Lock,
  BarChart3,
  RefreshCw,
  Users,
  Clock,
  CornerDownLeft,
  Monitor,
  Smartphone,
  Tablet,
  LayoutDashboard,
  Activity,
  Megaphone,
  Settings,
  ShieldCheck,
  Database,
  Zap,
  Bell,
  ClipboardList,
  CircleDollarSign,
  Package,
  HelpCircle,
  Send,
  List,
  FormInput,
  Layout,
  Workflow,
  MessageSquare,
  Eye,
  Trash2,
  Plus,
  Edit,
  Copy,
  Download,
  Upload,
  Filter,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Menu,
  LogOut,
  Home,
  Newspaper,
  Video,
  Headphones,
  Layers,
  Tags,
  Globe,
  MailOpen,
  UserCheck,
  UserPlus,
  CreditCard,
  Receipt,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Sparkles,
};

