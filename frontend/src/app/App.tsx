import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Brain,
  Star,
  Zap,
  Shield,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  Check,
  X,
  Crown,
  ChevronRight,
  Bookmark,
  History as HistoryIcon,
  Settings as SettingsIcon,
  LogOut,
  LayoutDashboard,
  TrendingUp,
  BookOpen,
  Plane,
  Gamepad2,
  Music,
  Utensils,
  Laptop,
  Briefcase,
  ShoppingBag,
  RefreshCw,
  Copy,
  Share2,
  ChevronDown,
  Bell,
  Trash2,
  Camera,
  Edit3,
  BarChart2,
  Clock,
  ChevronLeft,
  Globe,
  Moon,
  Sun,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  CreditCard,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { api, setTokens, clearTokens } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type Page =
  | "landing"
  | "login"
  | "register"
  | "dashboard"
  | "recommend"
  | "results"
  | "history"
  | "saved"
  | "analytics"
  | "settings"
  | "profile"
  | "kids"
  | "payment";
type Category =
  | "Movies"
  | "Books"
  | "Career"
  | "Travel"
  | "Electronics"
  | "Courses"
  | "Fashion"
  | "Restaurants"
  | "Games"
  | "Music";

interface UserProfile {
  name: string;
  email: string;
  credits: number;
  plan: "free" | "pro";
  bio: string;
  location: string;
  website: string;
  joinDate: string;
  avatar: string;
  notifications: { email: boolean; push: boolean; weekly: boolean };
  darkMode: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

interface Recommendation {
  title: string;
  description: string;
  reason: string;
  rating: number;
  tags: string[];
  pros: string[];
  cons: string[];
  price: string;
  emoji: string;
}

interface HistoryEntry {
  id: string;
  category: Category;
  interests: string;
  purpose: string;
  results: Recommendation[];
  date: string;
  savedCount: number;
}

interface SavedItem {
  rec: Recommendation;
  category: Category;
  savedAt: string;
  historyId: string;
}

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FREE_CREDITS = 5;

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  Movies: <Star size={16} />,
  Books: <BookOpen size={16} />,
  Career: <Briefcase size={16} />,
  Travel: <Plane size={16} />,
  Electronics: <Laptop size={16} />,
  Courses: <Brain size={16} />,
  Fashion: <ShoppingBag size={16} />,
  Restaurants: <Utensils size={16} />,
  Games: <Gamepad2 size={16} />,
  Music: <Music size={16} />,
};

const CATEGORY_COLORS: Record<Category, string> = {
  Movies: "#7c3aed",
  Books: "#3b82f6",
  Career: "#10b981",
  Travel: "#f59e0b",
  Electronics: "#ef4444",
  Courses: "#8b5cf6",
  Fashion: "#ec4899",
  Restaurants: "#f97316",
  Games: "#14b8a6",
  Music: "#a78bfa",
};

const CATEGORY_TO_SLUG: Record<Category, string> = {
  Movies: "movies",
  Books: "books",
  Career: "career",
  Travel: "travel",
  Electronics: "electronics",
  Courses: "courses",
  Fashion: "fashion",
  Restaurants: "restaurants",
  Games: "games",
  Music: "music",
};

const MOCK_RECS: Record<Category, Recommendation[]> = {
  Movies: [
    {
      title: "Inception",
      description:
        "A mind-bending sci-fi thriller about dream manipulation and the nature of reality.",
      reason:
        "Matches your interest in cerebral narratives with stunning visuals.",
      rating: 9.3,
      tags: ["Sci-Fi", "Thriller"],
      pros: ["Incredible visual effects", "Complex story", "Hans Zimmer score"],
      cons: ["Complex on first watch", "Long runtime"],
      price: "Stream on Netflix",
      emoji: "🎬",
    },
    {
      title: "Interstellar",
      description:
        "A cosmic journey through wormholes to save humanity from extinction.",
      reason: "Perfect for science grounded in emotion.",
      rating: 8.9,
      tags: ["Sci-Fi", "Drama"],
      pros: ["Stunning cinematography", "Emotional depth"],
      cons: ["3rd act divides audiences"],
      price: "Stream on Paramount+",
      emoji: "🚀",
    },
    {
      title: "Everything Everywhere All at Once",
      description:
        "A multiverse adventure about a Chinese-American laundromat owner.",
      reason:
        "Perfectly blends absurdist humor with profound emotional resonance.",
      rating: 9.1,
      tags: ["Sci-Fi", "Comedy"],
      pros: ["Wildly original", "Deeply emotional"],
      cons: ["Chaotic pacing initially"],
      price: "Stream on A24+",
      emoji: "🌀",
    },
  ],
  Books: [
    {
      title: "Atomic Habits",
      description:
        "A proven framework for building good habits and breaking bad ones.",
      reason: "Best-in-class for practical self-improvement readers.",
      rating: 9.0,
      tags: ["Self-Help", "Productivity"],
      pros: ["Actionable advice", "Research-backed"],
      cons: ["Repetitive at times"],
      price: "$16 on Amazon",
      emoji: "📗",
    },
    {
      title: "The Pragmatic Programmer",
      description: "Timeless software craftsmanship advice for developers.",
      reason: "Essential reading for anyone serious about software quality.",
      rating: 9.2,
      tags: ["Tech", "Career"],
      pros: ["Timeless advice", "Practical examples"],
      cons: ["Some dated examples"],
      price: "$45 on O'Reilly",
      emoji: "💻",
    },
    {
      title: "Sapiens",
      description:
        "A brief history of humankind from the Stone Age to the present.",
      reason: "Broadens perspective and sharpens critical thinking.",
      rating: 8.8,
      tags: ["History", "Science"],
      pros: ["Engaging narrative", "Mind-expanding"],
      cons: ["Some oversimplifications"],
      price: "$14 on Amazon",
      emoji: "📘",
    },
  ],
  Career: [
    {
      title: "UX Designer",
      description:
        "Design intuitive digital experiences for web and mobile products.",
      reason: "Combines creativity with tech — high demand, remote-friendly.",
      rating: 9.1,
      tags: ["Design", "Tech", "Remote"],
      pros: ["High demand", "Creative + analytical"],
      cons: ["Portfolio required"],
      price: "$85K–$130K/yr",
      emoji: "🎨",
    },
    {
      title: "Data Scientist",
      description:
        "Extract insights from large datasets using ML and statistics.",
      reason: "Top-paying field with explosive growth in AI era.",
      rating: 9.4,
      tags: ["AI", "ML", "High-pay"],
      pros: ["Excellent salary", "Impactful work"],
      cons: ["Steep learning curve"],
      price: "$100K–$160K/yr",
      emoji: "📊",
    },
    {
      title: "Product Manager",
      description:
        "Bridge business and engineering by owning the product roadmap.",
      reason: "Ideal for analytical thinkers who love working with teams.",
      rating: 8.7,
      tags: ["Leadership", "Strategy"],
      pros: ["Varied work", "High visibility"],
      cons: ["No direct control"],
      price: "$110K–$175K/yr",
      emoji: "🗺️",
    },
  ],
  Travel: [
    {
      title: "Kyoto, Japan",
      description:
        "Ancient temples, bamboo groves, and sublime Japanese cuisine.",
      reason: "Perfect for culture-seekers who appreciate quiet beauty.",
      rating: 9.5,
      tags: ["Culture", "Food", "History"],
      pros: ["Unique culture", "Safe", "World-class food"],
      cons: ["Expensive", "Crowded in spring"],
      price: "$2,500–$4,000/week",
      emoji: "⛩️",
    },
    {
      title: "Lisbon, Portugal",
      description:
        "Sun-drenched city of fado music, trams, and Atlantic seafood.",
      reason: "Affordable European gem with incredible food scene.",
      rating: 9.2,
      tags: ["Europe", "Budget-friendly"],
      pros: ["Affordable", "Great food", "Walkable"],
      cons: ["Hilly terrain"],
      price: "$1,200–$2,000/week",
      emoji: "🌊",
    },
    {
      title: "Banff, Canada",
      description: "Turquoise lakes and dramatic Rocky Mountain wilderness.",
      reason: "Unmatched for outdoor adventure and raw natural beauty.",
      rating: 9.3,
      tags: ["Nature", "Adventure", "Hiking"],
      pros: ["Stunning scenery", "World-class hiking"],
      cons: ["Cold winters", "Busy in summer"],
      price: "$1,800–$3,000/week",
      emoji: "🏔️",
    },
  ],
  Electronics: [
    {
      title: "Sony WH-1000XM5",
      description: "Industry-leading noise cancelling wireless headphones.",
      reason: "Best ANC headphones available at this price point.",
      rating: 9.4,
      tags: ["Audio", "ANC", "Wireless"],
      pros: ["Best-in-class ANC", "30hr battery"],
      cons: ["Premium price"],
      price: "$349",
      emoji: "🎧",
    },
    {
      title: "iPad Pro M4",
      description: "Professional-grade tablet with Apple Silicon chip.",
      reason: "Unmatched performance for creative professionals.",
      rating: 9.5,
      tags: ["Apple", "Creative", "Pro"],
      pros: ["Incredible performance", "ProMotion display"],
      cons: ["Expensive", "iPadOS limits"],
      price: "From $999",
      emoji: "📱",
    },
    {
      title: "LG C3 OLED TV",
      description: "Perfect blacks, infinite contrast, and gaming features.",
      reason: "Reference-quality display for cinema and gaming alike.",
      rating: 9.3,
      tags: ["TV", "OLED", "Gaming"],
      pros: ["Perfect blacks", "120Hz gaming"],
      cons: ["Risk of burn-in"],
      price: '$1,299 (55")',
      emoji: "📺",
    },
  ],
  Courses: [
    {
      title: "CS50 by Harvard",
      description:
        "The world's most popular intro to computer science, free on edX.",
      reason: "Best foundation for anyone entering tech.",
      rating: 9.6,
      tags: ["Free", "Beginner", "CS"],
      pros: ["World-class instruction", "Free", "Certificate"],
      cons: ["Time intensive"],
      price: "Free / $199 cert",
      emoji: "🎓",
    },
    {
      title: "Deep Learning Specialization",
      description:
        "Andrew Ng's comprehensive deep learning course on Coursera.",
      reason: "Gold standard for learning neural networks and AI.",
      rating: 9.4,
      tags: ["AI", "ML", "Intermediate"],
      pros: ["Expert instructor", "Hands-on projects"],
      cons: ["Math-heavy"],
      price: "$49/month Coursera",
      emoji: "🧠",
    },
    {
      title: "The Web Developer Bootcamp",
      description: "Full-stack web development from zero to hero on Udemy.",
      reason: "Most comprehensive single course for full-stack beginners.",
      rating: 9.2,
      tags: ["Web", "Full-stack", "Beginner"],
      pros: ["Comprehensive", "Affordable", "Updated"],
      cons: ["Long course"],
      price: "$14.99 on Udemy",
      emoji: "🌐",
    },
  ],
  Fashion: [
    {
      title: "Uniqlo Merino Wool Sweater",
      description: "Premium merino wool in minimalist Japanese cuts.",
      reason: "Best value luxury basics — office to weekend.",
      rating: 9.0,
      tags: ["Minimalist", "Basics", "Value"],
      pros: ["Excellent quality", "Timeless style", "Affordable"],
      cons: ["Limited colorways"],
      price: "$39–$59",
      emoji: "🧥",
    },
    {
      title: "Nike Air Force 1",
      description: "The iconic all-white low-top sneaker, endlessly versatile.",
      reason: "Single most versatile sneaker in any wardrobe.",
      rating: 9.3,
      tags: ["Sneakers", "Classic", "Versatile"],
      pros: ["Works with everything", "Durable", "Iconic"],
      cons: ["Gets dirty easily"],
      price: "$110",
      emoji: "👟",
    },
    {
      title: "Levi's 501 Jeans",
      description: "The original straight-leg jeans since 1873.",
      reason: "No wardrobe is complete without a perfect pair of 501s.",
      rating: 9.1,
      tags: ["Denim", "Classic", "Casual"],
      pros: ["Timeless", "Durable", "Any occasion"],
      cons: ["Shrinks when washed"],
      price: "$70–$90",
      emoji: "👖",
    },
  ],
  Restaurants: [
    {
      title: "Nobu Matsuhisa",
      description: "World-renowned Japanese-Peruvian fusion by chef Nobu.",
      reason: "Iconic dishes and impeccable service for a special night out.",
      rating: 9.3,
      tags: ["Japanese", "Fine Dining", "Fusion"],
      pros: ["Legendary food", "Unique flavors"],
      cons: ["Very expensive"],
      price: "$$$$ per person",
      emoji: "🍣",
    },
    {
      title: "The Ivy",
      description:
        "British institution famous for its ivy-covered walls and classic brasserie menu.",
      reason: "Perfect for celebrations — atmosphere is unmatched.",
      rating: 8.9,
      tags: ["British", "Classic", "Elegant"],
      pros: ["Beautiful setting", "Celebrity spotting"],
      cons: ["Hard to get reservations"],
      price: "$$$ per person",
      emoji: "🌿",
    },
    {
      title: "Shake Shack",
      description: "Beloved fast-casual burgers, fries, and shakes.",
      reason: "Best quality-to-price burger experience, hands down.",
      rating: 8.7,
      tags: ["Burgers", "Casual", "Fast"],
      pros: ["Consistent quality", "Affordable", "Widely available"],
      cons: ["Lines can be long"],
      price: "$15–$25 per person",
      emoji: "🍔",
    },
  ],
  Games: [
    {
      title: "Elden Ring",
      description:
        "Open-world action RPG from FromSoftware and George R.R. Martin.",
      reason: "Masterpiece of game design — rewarding and deeply explorable.",
      rating: 9.6,
      tags: ["RPG", "Action", "Open-world"],
      pros: ["Massive world", "Satisfying challenge"],
      cons: ["Very difficult"],
      price: "$59.99 on Steam",
      emoji: "⚔️",
    },
    {
      title: "The Witcher 3",
      description:
        "Epic fantasy RPG with branching narrative and a vast open world.",
      reason: "Unmatched storytelling and world-building in gaming.",
      rating: 9.5,
      tags: ["RPG", "Fantasy", "Story"],
      pros: ["Rich story", "Incredible world", "100+ hours"],
      cons: ["Dated controls"],
      price: "$39.99 / often on sale",
      emoji: "🐺",
    },
    {
      title: "Celeste",
      description:
        "Precision platformer with a touching story about mental health.",
      reason:
        "Proves games can be emotionally profound AND mechanically brilliant.",
      rating: 9.2,
      tags: ["Indie", "Platformer", "Story"],
      pros: ["Perfect controls", "Emotional story"],
      cons: ["Very challenging"],
      price: "$19.99",
      emoji: "🏔️",
    },
  ],
  Music: [
    {
      title: "Kendrick Lamar — DAMN.",
      description:
        "Pulitzer Prize-winning rap album exploring faith, luck, and morality.",
      reason: "One of the greatest albums of the 21st century.",
      rating: 9.5,
      tags: ["Hip-Hop", "Rap", "Lyrical"],
      pros: ["Lyrically dense", "Cohesive vision"],
      cons: ["Not for casual listeners"],
      price: "Stream on Spotify",
      emoji: "🎤",
    },
    {
      title: "Radiohead — OK Computer",
      description:
        "Paranoid android rock for the modern age — timeless and visionary.",
      reason:
        "Essential listen for anyone interested in art rock or electronic.",
      rating: 9.6,
      tags: ["Alternative", "Rock", "Art"],
      pros: ["Genre-defining", "Emotionally powerful"],
      cons: ["Dense and challenging"],
      price: "Stream on Apple Music",
      emoji: "🎸",
    },
    {
      title: "Frank Ocean — Blonde",
      description:
        "Introspective R&B masterpiece exploring identity and memory.",
      reason: "Modern classic — layered, intimate, and deeply rewarding.",
      rating: 9.4,
      tags: ["R&B", "Soul", "Indie"],
      pros: ["Incredibly personal", "Unique sound"],
      cons: ["Non-linear structure"],
      price: "Stream on Apple Music",
      emoji: "🎵",
    },
  ],
};

const ANALYTICS_WEEKLY = [
  { day: "Mon", recs: 2 },
  { day: "Tue", recs: 5 },
  { day: "Wed", recs: 3 },
  { day: "Thu", recs: 7 },
  { day: "Fri", recs: 4 },
  { day: "Sat", recs: 8 },
  { day: "Sun", recs: 6 },
];

const DEFAULT_USER: UserProfile = {
  name: "Alex Johnson",
  email: "alex@example.com",
  credits: FREE_CREDITS,
  plan: "free",
  bio: "AI enthusiast exploring the best recommendations the web has to offer.",
  location: "San Francisco, CA",
  website: "alexjohnson.dev",
  joinDate: "July 2025",
  avatar: "AJ",
  notifications: { email: true, push: false, weekly: true },
  darkMode: true,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
};

function mapApiUserToProfile(u: any): UserProfile {
  const displayName = `${u.first_name} ${u.last_name}`;
  const initials = displayName
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return {
    ...DEFAULT_USER,
    name: displayName,
    email: u.email,
    avatar: initials,
    credits: u.credits,
    plan: u.plan,
    cancelAtPeriodEnd: !!u.cancel_at_period_end,
    currentPeriodEnd: u.current_period_end || null,
  };
}

const SIDEBAR_ITEMS = [
  { id: "dashboard", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
  { id: "recommend", icon: <Sparkles size={16} />, label: "Recommend" },
  { id: "kids", icon: <Gamepad2 size={16} />, label: "Kids" },
  { id: "history", icon: <HistoryIcon size={16} />, label: "History" },
  { id: "saved", icon: <Bookmark size={16} />, label: "Saved" },
  { id: "analytics", icon: <BarChart2 size={16} />, label: "Analytics" },
  { id: "profile", icon: <UserIcon size={16} />, label: "Profile" },
  { id: "settings", icon: <SettingsIcon size={16} />, label: "Settings" },
] as const;

// Real URL per page, so the browser Back/Forward buttons and page refresh
// both work correctly instead of the app being a single-URL SPA.
const PAGE_TO_PATH: Record<Page, string> = {
  landing: "/",
  login: "/login",
  register: "/register",
  dashboard: "/dashboard",
  recommend: "/recommend",
  results: "/results",
  history: "/history",
  saved: "/saved",
  analytics: "/analytics",
  settings: "/settings",
  profile: "/profile",
  kids: "/kids",
  payment: "/payment",
};
const PATH_TO_PAGE: Record<string, Page> = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page as Page]),
) as Record<string, Page>;

// ─── Shared UI ────────────────────────────────────────────────────────────────

function GradientOrb({ className }: { className?: string }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 pointer-events-none ${className}`}
    />
  );
}

function GlassCard({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--fg)]/5 backdrop-blur-md border border-[var(--border)]/10 rounded-2xl ${onClick ? "cursor-pointer hover:bg-[var(--fg)]/[0.08] hover:border-[var(--border)]/20 transition-all duration-200" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 hover:shadow-violet-900/50 hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

function InputField({
  label,
  type,
  value,
  onChange,
  placeholder,
  icon,
  textarea,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  textarea?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const baseClass =
    "w-full bg-[var(--fg)]/6 border border-[var(--border)]/10 rounded-xl px-4 py-3 text-[var(--fg)] placeholder-[var(--fg)]/25 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--fg)]/70">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-3.5 text-[var(--fg)]/30">
            {icon}
          </span>
        )}
        {textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={`${baseClass} resize-none`}
            style={{ paddingLeft: icon ? "2.75rem" : undefined }}
          />
        ) : (
          <input
            type={isPassword && show ? "text" : type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={baseClass}
            style={{ paddingLeft: icon ? "2.75rem" : undefined }}
          />
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3.5 top-3.5 text-[var(--fg)]/30 hover:text-[var(--fg)]/60 transition-colors"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  const baseClass =
    "w-full bg-[var(--fg)]/6 border border-[var(--border)]/10 rounded-xl px-4 py-3 text-[var(--fg)] outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm appearance-none";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--fg)]/70">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-3.5 text-[var(--fg)]/30 pointer-events-none">
            {icon}
          </span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
          style={{ paddingLeft: icon ? "2.75rem" : undefined }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[var(--surface-solid-3)]">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3.5 top-4 text-[var(--fg)]/30 pointer-events-none"
        />
      </div>
    </div>
  );
}

function CreditBadge({
  credits,
  plan,
}: {
  credits: number;
  plan: "free" | "pro";
}) {
  if (plan === "pro")
    return (
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/30 px-3 py-1.5 rounded-full">
        <Crown size={13} className="text-amber-400" />
        <span className="text-xs font-semibold text-amber-300">Pro Plan</span>
      </div>
    );
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${credits > 1 ? "bg-violet-500/10 border-violet-400/30" : "bg-red-500/10 border-red-400/30"}`}
    >
      <Zap
        size={13}
        className={credits > 1 ? "text-violet-400" : "text-red-400"}
      />
      <span
        className={`text-xs font-semibold ${credits > 1 ? "text-violet-300" : "text-red-300"}`}
      >
        {credits} credit{credits !== 1 ? "s" : ""} left
      </span>
    </div>
  );
}

function ToastNotification({
  toasts,
  remove,
}: {
  toasts: Toast[];
  remove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl text-sm font-medium transition-all
          ${t.type === "success" ? "bg-green-500/15 border-green-400/30 text-green-300" : t.type === "error" ? "bg-red-500/15 border-red-400/30 text-red-300" : "bg-blue-500/15 border-blue-400/30 text-blue-300"}`}
        >
          {t.type === "success" ? (
            <CheckCircle size={15} />
          ) : t.type === "error" ? (
            <AlertTriangle size={15} />
          ) : (
            <Info size={15} />
          )}
          {t.message}
          <button
            onClick={() => remove(t.id)}
            className="ml-2 opacity-60 hover:opacity-100"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Layout Shell ─────────────────────────────────────────────────────────────

function AppShell({
  user,
  page,
  onNavigate,
  onLogout,
  children,
  showSub,
  setShowSub,
  theme,
  onToggleTheme,
}: {
  user: UserProfile;
  page: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
  showSub: boolean;
  setShowSub: (v: boolean) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const pct = user.plan === "pro" ? 100 : (user.credits / FREE_CREDITS) * 100;

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-[var(--border)]/6 flex flex-col py-6 px-3 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight">SmartAI</span>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as Page)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                ${page === item.id ? "bg-violet-500/15 text-violet-300 border border-violet-400/20" : "text-[var(--fg)]/50 hover:text-[var(--fg)] hover:bg-[var(--fg)]/5"}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* Credit meter */}
        <div className="mt-4">
          {user.plan === "free" ? (
            <div className="bg-[var(--fg)]/4 border border-[var(--border)]/8 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--fg)]/60">
                  Free Credits
                </span>
                <span className="text-xs font-bold text-violet-300">
                  {user.credits}/{FREE_CREDITS}
                </span>
              </div>
              <div className="h-1.5 bg-[var(--fg)]/10 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <button
                onClick={() => setShowSub(true)}
                className="w-full text-xs font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 rounded-lg py-2 transition-all"
              >
                {user.credits === 0 ? "Upgrade Now" : "Upgrade to Pro"}
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-400/20 rounded-xl p-4 flex items-center gap-2.5">
              <Crown size={16} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-300">Pro Plan</p>
                <p className="text-xs text-[var(--fg)]/35">Unlimited access</p>
              </div>
            </div>
          )}
        </div>

        {/* User footer */}
        <button
          onClick={() => onNavigate("profile")}
          className="flex items-center gap-2.5 px-3 py-3 mt-3 rounded-xl hover:bg-[var(--fg)]/5 transition-all text-left"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
            {user.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[var(--fg)]/80 truncate">
              {user.name}
            </p>
            <p className="text-xs text-[var(--fg)]/30 truncate">{user.email}</p>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--fg)]/30 hover:text-red-400 hover:bg-red-500/8 transition-all mt-1"
        >
          <LogOut size={14} /> Sign out
        </button>
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--fg)]/30 hover:text-[var(--fg)] hover:bg-[var(--fg)]/5 transition-all"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto relative">{children}</main>
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function LandingPage({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--fg)] overflow-hidden relative"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <GradientOrb className="w-[600px] h-[600px] bg-violet-600 top-[-200px] left-[-100px]" />
      <GradientOrb className="w-[500px] h-[500px] bg-blue-600 top-[-100px] right-[-100px]" />
      <GradientOrb className="w-[400px] h-[400px] bg-indigo-500 bottom-[-100px] left-[30%]" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[var(--border)]/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Smart Recommend AI
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="px-5 py-2 text-sm font-medium text-[var(--fg)]/70 hover:text-[var(--fg)] transition-colors"
          >
            Sign in
          </button>
          <PrimaryButton onClick={onRegister} className="py-2 px-5 text-sm">
            Get started free
          </PrimaryButton>
        </div>
      </nav>

      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-20">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-400/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles size={13} className="text-violet-400" />
          <span className="text-xs font-medium text-violet-300">
            Powered by GPT-4 · 3 free recommendations
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 max-w-4xl bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
          Discover Perfect
          <br />
          Recommendations
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            Powered by AI
          </span>
        </h1>
        <p className="text-lg text-[var(--fg)]/50 max-w-xl mb-10 leading-relaxed">
          Find books, movies, careers, gadgets, travel destinations and more —
          personalized to your taste.
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <PrimaryButton
            onClick={onRegister}
            className="px-8 py-3.5 text-base flex items-center gap-2"
          >
            Start Exploring <ArrowRight size={16} />
          </PrimaryButton>
          <button
            onClick={onLogin}
            className="px-8 py-3.5 text-base font-semibold text-[var(--fg)]/60 hover:text-[var(--fg)] border border-[var(--border)]/10 hover:border-[var(--border)]/20 rounded-xl transition-all"
          >
            Sign in
          </button>
        </div>
        <div className="flex items-center gap-8 mt-16 flex-wrap justify-center">
          {[
            ["50K+", "Recommendations"],
            ["10", "Categories"],
            ["4.9★", "Rating"],
          ].map(([num, label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                {num}
              </div>
              <div className="text-sm text-[var(--fg)]/40 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: <Brain size={20} />,
              title: "AI-Powered",
              desc: "GPT-4 analyzes your preferences to deliver hyper-personalized picks.",
            },
            {
              icon: <Zap size={20} />,
              title: "Instant Results",
              desc: "Get 10 tailored recommendations with pros, cons, and ratings in seconds.",
            },
            {
              icon: <Shield size={20} />,
              title: "Privacy First",
              desc: "Your preferences stay yours. No data sold, ever.",
            },
          ].map((f) => (
            <GlassCard key={f.title} className="p-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-400/20 flex items-center justify-center text-violet-400 mb-4">
                {f.icon}
              </div>
              <h3 className="font-bold text-base mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--fg)]/50 leading-relaxed">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 pb-24 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold mb-3">Simple Pricing</h2>
        <p className="text-[var(--fg)]/50 mb-10">
          Start free. Upgrade when you need more.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GlassCard className="p-7 text-left">
            <p className="text-xs font-semibold text-[var(--fg)]/40 uppercase tracking-widest mb-3">
              Free
            </p>
            <p className="text-4xl font-extrabold mb-1">$0</p>
            <p className="text-sm text-[var(--fg)]/40 mb-6">forever</p>
            {["3 AI recommendations", "All 10 categories", "Basic history"].map(
              (f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 mb-2 text-sm text-[var(--fg)]/70"
                >
                  <Check size={14} className="text-violet-400 shrink-0" /> {f}
                </div>
              ),
            )}
            <PrimaryButton
              onClick={onRegister}
              className="w-full mt-6 text-sm py-2.5"
            >
              Get started
            </PrimaryButton>
          </GlassCard>
          <GlassCard className="p-7 text-left border-violet-400/30 bg-gradient-to-b from-violet-500/10 to-blue-500/5 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              POPULAR
            </div>
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">
              Pro
            </p>
            <p className="text-4xl font-extrabold mb-1">$8</p>
            <p className="text-sm text-[var(--fg)]/40 mb-6">per month</p>
            {[
              "Unlimited recommendations",
              "All 10 categories",
              "Full history & bookmarks",
              "PDF export",
              "Priority AI",
            ].map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 mb-2 text-sm text-[var(--fg)]/70"
              >
                <Check size={14} className="text-violet-400 shrink-0" /> {f}
              </div>
            ))}
            <PrimaryButton
              onClick={onRegister}
              className="w-full mt-6 text-sm py-2.5"
            >
              Start free trial
            </PrimaryButton>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function AuthPage({
  mode,
  onSwitch,
  onAuth,
}: {
  mode: "login" | "register";
  onSwitch: () => void;
  onAuth: (u: UserProfile) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("prefer_not_to_say");
  const [country, setCountry] = useState("India");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "register") {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Please enter your first and last name.");
        return;
      }
      if (!dateOfBirth) {
        setError("Please enter your date of birth.");
        return;
      }
      if (!country.trim()) {
        setError("Please enter your country.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const data = await api.register({
          firstName,
          lastName,
          email,
          password,
          confirmPassword,
          dateOfBirth,
          gender,
          country,
        });
        setTokens(data.accessToken, data.refreshToken);
        onAuth(mapApiUserToProfile(data.user));
      } else {
        const data = await api.login(email, password);
        setTokens(data.accessToken, data.refreshToken);
        onAuth(mapApiUserToProfile(data.user));
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <GradientOrb className="w-[500px] h-[500px] bg-violet-700 top-[-150px] left-[-100px]" />
      <GradientOrb className="w-[400px] h-[400px] bg-blue-700 bottom-[-100px] right-[-50px]" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-900/40">
            <Brain size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-[var(--fg)]/40">
            {mode === "login"
              ? "Sign in to access your AI recommendations"
              : `Start with ${FREE_CREDITS} free AI recommendations`}
          </p>
        </div>
        {mode === "register" && (
          <div className="flex items-center gap-3 bg-violet-500/10 border border-violet-400/20 rounded-xl px-4 py-3 mb-6">
            <Zap size={15} className="text-violet-400 shrink-0" />
            <p className="text-xs text-violet-300 leading-relaxed">
              <span className="font-semibold">{FREE_CREDITS} free credits</span>{" "}
              included — no credit card required. Upgrade anytime for unlimited
              access.
            </p>
          </div>
        )}
        <GlassCard className="p-7">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="First name"
                  type="text"
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="Alex"
                  icon={<UserIcon size={15} />}
                />
                <InputField
                  label="Last name"
                  type="text"
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Johnson"
                />
              </div>
            )}
            <InputField
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="alex@example.com"
              icon={<Mail size={15} />}
            />
            <InputField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={
                mode === "login"
                  ? "Enter your password"
                  : "At least 8 characters"
              }
              icon={<Lock size={15} />}
            />
            {mode === "register" && (
              <>
                <InputField
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter your password"
                  icon={<Lock size={15} />}
                />
                <InputField
                  label="Date of birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  icon={<Clock size={15} />}
                />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Gender (optional)"
                    value={gender}
                    onChange={setGender}
                    options={[
                      {
                        value: "prefer_not_to_say",
                        label: "Prefer not to say",
                      },
                      { value: "female", label: "Female" },
                      { value: "male", label: "Male" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                  <InputField
                    label="Country"
                    type="text"
                    value={country}
                    onChange={setCountry}
                    placeholder="India"
                    icon={<Globe size={15} />}
                  />
                </div>
              </>
            )}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2.5 text-xs text-red-300">
                <X size={13} className="shrink-0" /> {error}
              </div>
            )}
            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1"
            >
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </PrimaryButton>
          </form>
          <div className="mt-5 pt-5 border-t border-[var(--border)]/8 text-center">
            <p className="text-sm text-[var(--fg)]/40">
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={onSwitch}
                className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
              >
                {mode === "login" ? "Sign up free" : "Sign in"}
              </button>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Subscription Modal ───────────────────────────────────────────────────────

function SubscriptionModal({
  onUpgrade,
  onGoToPayment,
  onClose,
}: {
  onUpgrade: () => void;
  onGoToPayment: (plan: "monthly" | "yearly") => void;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState("yearly");
  const [checking, setChecking] = useState(true);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getPaymentStatus()
      .then((data) => {
        if (!cancelled) setConfigured(!!data.configured);
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md">
        <GlassCard className="p-7 border-violet-400/20 bg-[var(--surface-solid-1)]/95">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-[var(--fg)]/30 hover:text-[var(--fg)]/70 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-400/20 flex items-center justify-center mx-auto mb-4">
              <Crown size={24} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-extrabold mb-2">
              You've used all free credits
            </h2>
            <p className="text-sm text-[var(--fg)]/50 leading-relaxed">
              Upgrade to Pro for unlimited AI recommendations, full history,
              bookmarks, and PDF exports.
            </p>
          </div>
          <div className="flex gap-3 mb-6">
            {[
              {
                id: "monthly",
                label: "Monthly",
                price: "$12",
                period: "/month",
                savings: null,
              },
              {
                id: "yearly",
                label: "Yearly",
                price: "$8",
                period: "/month",
                savings: "Save 33%",
              },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPlan(p.id)}
                className={`flex-1 border rounded-xl py-3 px-4 text-left transition-all ${plan === p.id ? "border-violet-400/50 bg-violet-500/15" : "border-[var(--border)]/10 bg-[var(--fg)]/3 hover:border-[var(--border)]/20"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--fg)]/60">
                    {p.label}
                  </span>
                  {p.savings && (
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                      {p.savings}
                    </span>
                  )}
                </div>
                <span className="text-xl font-extrabold">{p.price}</span>
                <span className="text-xs text-[var(--fg)]/40">{p.period}</span>
              </button>
            ))}
          </div>
          <div className="space-y-2 mb-6">
            {[
              "Unlimited AI recommendations",
              "Full history & bookmarks",
              "PDF export",
              "Priority GPT-4 access",
            ].map((b) => (
              <div
                key={b}
                className="flex items-center gap-2.5 text-sm text-[var(--fg)]/70"
              >
                <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-violet-400" />
                </div>{" "}
                {b}
              </div>
            ))}
          </div>
          {!checking && !configured && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-400/20 rounded-lg px-3 py-2.5 text-xs text-amber-300 mb-4">
              <Info size={13} className="shrink-0 mt-0.5" />
              <span>
                Real payments aren't set up yet (needs a Stripe account — see
                README section 6). You can still try Pro features below in
                demo mode, which won't charge anything.
              </span>
            </div>
          )}
          <PrimaryButton
            onClick={configured ? onUpgrade : () => onGoToPayment(plan as "monthly" | "yearly")}
            disabled={checking}
            className="w-full py-3 flex items-center justify-center gap-2"
          >
            <Crown size={15} />
            {configured
              ? `Upgrade to Pro — ${plan === "yearly" ? "$8/mo" : "$12/mo"}`
              : "Continue to payment (demo, no charge)"}
          </PrimaryButton>
          <button
            onClick={onClose}
            className="w-full mt-3 text-sm text-[var(--fg)]/35 hover:text-[var(--fg)]/60 py-2 transition-colors"
          >
            Maybe later
          </button>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Payment (fake checkout — no real transaction) ─────────────────────────
//
// This is a simulated checkout page. It walks through the same steps a real
// card-payment flow would (card details, validation, a brief "processing"
// state), but it never contacts a payment processor and no money moves. On
// "success" it simply calls the demo-upgrade endpoint, which flips the
// account to Pro server-side without charging anything. This exists so the
// upgrade flow always has a working procedure, Stripe or not.

function formatCardNumber(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function luhnCheck(digits: string) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return digits.length > 0 && sum % 10 === 0;
}

function PaymentPage({
  plan,
  onSuccess,
  onCancel,
  toast,
}: {
  plan: "monthly" | "yearly";
  onSuccess: (user: any) => void;
  onCancel: () => void;
  toast: (msg: string, type?: Toast["type"]) => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"form" | "processing" | "success">(
    "form",
  );

  const price = plan === "yearly" ? 8 : 12;
  const label = plan === "yearly" ? "Pro — Yearly" : "Pro — Monthly";

  function validate() {
    const next: Record<string, string> = {};
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 16 || !luhnCheck(digits)) {
      next.cardNumber = "Enter a valid card number.";
    }
    if (!cardName.trim()) {
      next.cardName = "Enter the name on the card.";
    }
    const expiryMatch = /^(\d{2})\s*\/\s*(\d{2})$/.exec(expiry.trim());
    if (!expiryMatch) {
      next.expiry = "Use MM/YY.";
    } else {
      const month = Number(expiryMatch[1]);
      const year = 2000 + Number(expiryMatch[2]);
      const now = new Date();
      const expDate = new Date(year, month, 0);
      if (month < 1 || month > 12 || expDate < now) {
        next.expiry = "Card has expired.";
      }
    }
    if (!/^\d{3,4}$/.test(cvv.trim())) {
      next.cvv = "Enter a valid CVV.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("processing");
    // Simulated processing delay so the procedure feels real — no network
    // call is made with the card details above; they are never sent or
    // stored anywhere, only validated client-side, then discarded.
    await new Promise((r) => setTimeout(r, 1400));
    try {
      const data = await api.demoUpgrade();
      setStatus("success");
      setTimeout(() => onSuccess(data.user), 900);
    } catch (err: any) {
      setStatus("form");
      toast(err.message || "Could not complete the demo upgrade.", "error");
    }
  }

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <GradientOrb className="w-[500px] h-[500px] bg-violet-700 top-[-150px] left-[-100px]" />
      <GradientOrb className="w-[400px] h-[400px] bg-blue-700 bottom-[-100px] right-[-50px]" />
      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-[var(--fg)]/40 hover:text-[var(--fg)]/70 mb-5 transition-colors"
        >
          <ChevronLeft size={15} /> Back
        </button>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-400/20 rounded-xl px-4 py-3 mb-6 text-xs text-amber-300 leading-relaxed">
          <Info size={14} className="shrink-0" />
          This is a demo checkout. No real card network is contacted and no
          money moves — it exists to demonstrate the payment procedure.
        </div>
        <GlassCard className="p-7">
          {status === "success" ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-green-500/15 border border-green-400/20 flex items-center justify-center mx-auto mb-4">
                <Check size={26} className="text-green-400" />
              </div>
              <h2 className="text-xl font-extrabold mb-1">Payment successful</h2>
              <p className="text-sm text-[var(--fg)]/50">
                You're now on the Pro plan. Redirecting…
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-extrabold">{label}</h2>
                  <p className="text-sm text-[var(--fg)]/45">
                    Billed {plan === "yearly" ? "annually" : "monthly"}
                  </p>
                </div>
                <span className="text-2xl font-extrabold">
                  ${price}
                  <span className="text-sm text-[var(--fg)]/40">/mo</span>
                </span>
              </div>
              <form onSubmit={handlePay} className="flex flex-col gap-4">
                <InputField
                  label="Card number"
                  type="text"
                  value={cardNumber}
                  onChange={(v) => setCardNumber(formatCardNumber(v))}
                  placeholder="4242 4242 4242 4242"
                  icon={<CreditCard size={15} />}
                />
                {errors.cardNumber && (
                  <p className="text-xs text-red-400 -mt-3">
                    {errors.cardNumber}
                  </p>
                )}
                <InputField
                  label="Name on card"
                  type="text"
                  value={cardName}
                  onChange={setCardName}
                  placeholder="Alex Johnson"
                  icon={<UserIcon size={15} />}
                />
                {errors.cardName && (
                  <p className="text-xs text-red-400 -mt-3">
                    {errors.cardName}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <InputField
                      label="Expiry (MM/YY)"
                      type="text"
                      value={expiry}
                      onChange={setExpiry}
                      placeholder="12/28"
                      icon={<Clock size={15} />}
                    />
                    {errors.expiry && (
                      <p className="text-xs text-red-400 mt-1">
                        {errors.expiry}
                      </p>
                    )}
                  </div>
                  <div>
                    <InputField
                      label="CVV"
                      type="text"
                      value={cvv}
                      onChange={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      icon={<Lock size={15} />}
                    />
                    {errors.cvv && (
                      <p className="text-xs text-red-400 mt-1">{errors.cvv}</p>
                    )}
                  </div>
                </div>
                <PrimaryButton
                  type="submit"
                  disabled={status === "processing"}
                  className="w-full py-3 mt-1 flex items-center justify-center gap-2"
                >
                  {status === "processing" ? (
                    "Processing payment…"
                  ) : (
                    <>
                      <Lock size={14} /> Pay ${price} (demo)
                    </>
                  )}
                </PrimaryButton>
              </form>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardPage({
  user,
  onNavigate,
  setShowSub,
  history,
}: {
  user: UserProfile;
  onNavigate: (p: Page) => void;
  setShowSub: (v: boolean) => void;
  history: HistoryEntry[];
}) {
  const pct = user.plan === "pro" ? 100 : (user.credits / FREE_CREDITS) * 100;
  return (
    <div className="p-8 relative">
      <GradientOrb className="w-[400px] h-[400px] bg-violet-700 top-[-100px] right-[-100px]" />
      <div className="relative z-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">
              Good morning, {user.name.split(" ")[0]} 👋
            </h1>
            <p className="text-sm text-[var(--fg)]/40 mt-0.5">
              What would you like to discover today?
            </p>
          </div>
          <CreditBadge credits={user.credits} plan={user.plan} />
        </div>

        {/* CTA hero */}
        <div
          className="relative rounded-2xl overflow-hidden mb-7 p-7 border border-violet-400/20"
          style={{
            background:
              "linear-gradient(135deg,rgba(124,58,237,.2) 0%,rgba(59,130,246,.15) 100%)",
          }}
        >
          <GradientOrb className="w-[300px] h-[300px] bg-violet-600 -top-20 -right-20 opacity-30" />
          <div className="relative z-10">
            <h2 className="text-xl font-extrabold mb-2">
              Get AI Recommendations
            </h2>
            <p className="text-sm text-[var(--fg)]/60 mb-5 max-w-md">
              Tell us your preferences across 10 categories — movies, books,
              travel, careers, and more.
            </p>
            {user.credits > 0 || user.plan === "pro" ? (
              <PrimaryButton
                onClick={() => onNavigate("recommend")}
                className="flex items-center gap-2 text-sm py-2.5"
              >
                <Sparkles size={15} /> Start Exploring <ArrowRight size={14} />
              </PrimaryButton>
            ) : (
              <button
                onClick={() => setShowSub(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 transition-all"
              >
                <Crown size={15} /> Upgrade for Unlimited Access
              </button>
            )}
          </div>
        </div>

        {/* Category grid */}
        <h2 className="text-sm font-bold mb-4 text-[var(--fg)]/50 uppercase tracking-widest">
          Browse Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {(Object.keys(CATEGORY_ICONS) as Category[]).map((cat) => (
            <GlassCard
              key={cat}
              className="p-4 flex flex-col items-center gap-2 text-center"
              onClick={() =>
                user.credits > 0 || user.plan === "pro"
                  ? onNavigate("recommend")
                  : setShowSub(true)
              }
            >
              <span className="text-violet-400">{CATEGORY_ICONS[cat]}</span>
              <span className="text-xs font-semibold text-[var(--fg)]/70">{cat}</span>
            </GlassCard>
          ))}
        </div>

        {/* Recent history on dashboard */}
        {history.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[var(--fg)]/50 uppercase tracking-widest">
                Recent Activity
              </h2>
              <button
                onClick={() => onNavigate("history")}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-3 mb-8">
              {history.slice(0, 3).map((h) => (
                <GlassCard
                  key={h.id}
                  className="px-4 py-3 flex items-center gap-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center text-violet-400 shrink-0">
                    {CATEGORY_ICONS[h.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--fg)]/80 truncate">
                      {h.category} Recommendations
                    </p>
                    <p className="text-xs text-[var(--fg)]/35 truncate">
                      {h.interests || h.purpose || "General"} · {h.date}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[var(--fg)]/30">
                    {h.results.length} results
                  </span>
                </GlassCard>
              ))}
            </div>
          </>
        )}

        {/* Credits callout */}
        {user.plan === "free" && (
          <div
            className={`rounded-2xl border p-5 flex items-start gap-4 ${user.credits === 0 ? "border-red-400/20 bg-red-500/5" : "border-violet-400/20 bg-violet-500/5"}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${user.credits === 0 ? "bg-red-500/15" : "bg-violet-500/15"}`}
            >
              {user.credits === 0 ? (
                <X size={18} className="text-red-400" />
              ) : (
                <Zap size={18} className="text-violet-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm mb-0.5">
                {user.credits === 0
                  ? "No credits remaining"
                  : `${user.credits} free credit${user.credits !== 1 ? "s" : ""} remaining`}
              </p>
              <p className="text-xs text-[var(--fg)]/40 leading-relaxed mb-3">
                {user.credits === 0
                  ? "Upgrade to Pro for unlimited access."
                  : `Use your remaining credits wisely, or upgrade for unlimited recommendations.`}
              </p>
              <div className="h-1.5 bg-[var(--fg)]/10 rounded-full overflow-hidden mb-3 max-w-xs">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${user.credits === 0 ? "bg-red-500" : "bg-gradient-to-r from-violet-500 to-blue-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <button
                onClick={() => setShowSub(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-300 hover:text-violet-200 transition-colors"
              >
                <Crown size={12} /> Upgrade to Pro <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Recommend ────────────────────────────────────────────────────────────────

function RecommendPage({
  user,
  onBack,
  onResults,
  onShowSub,
}: {
  user: UserProfile;
  onBack: () => void;
  onResults: (
    recs: Recommendation[],
    meta: { category: Category; interests: string; purpose: string },
  ) => void;
  onShowSub: () => void;
}) {
  const [category, setCategory] = useState<Category>("Movies");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [genError, setGenError] = useState("");

  async function handleGenerate() {
    if (user.credits <= 0 && user.plan === "free") {
      onShowSub();
      return;
    }
    setGenError("");
    setLoading(true);

    // Every category is backed by the real MySQL database now. Travel uses
    // the richer destinations table + domestic/international blending logic;
    // the other 9 categories use the shared catalog_items table + the same
    // interest/budget/rating-based scoring approach.
    if (category === "Travel") {
      try {
        const budgetUsd = budget
          ? Number(budget.replace(/[^0-9.]/g, "")) || undefined
          : undefined;
        const data = await api.generateRecommendations({
          interests,
          purpose,
          budgetUsd,
          locationPreference: location || undefined,
          topN: 9,
        });
        const mapped: Recommendation[] = data.recommendations.map((d: any) => ({
          title: d.name,
          description: d.description,
          reason: d.reason,
          rating: Number(d.avg_rating) || Number(d.popularity_score) || 8,
          tags: (d.category || "").split(",").filter(Boolean).slice(0, 3),
          pros: [
            d.type === "domestic"
              ? "Easy to reach, no visa needed"
              : "A memorable international trip",
            `Best season: ${(d.best_season || "all_year").replace(/,/g, ", ")}`,
          ],
          cons: [`Budget tier: ${d.budget_tier}`],
          price: d.avg_cost_per_day_usd
            ? `~$${d.avg_cost_per_day_usd}/day`
            : "Varies",
          emoji: d.type === "domestic" ? "🏞️" : "🌍",
        }));
        setLoading(false);
        onResults(mapped, { category, interests, purpose });
      } catch (err: any) {
        setLoading(false);
        setGenError(
          err.message ||
            "Could not reach the recommendation API. Is the backend running?",
        );
      }
      return;
    }

    // All other categories are backed by the real MySQL catalog_items table +
    // the same rule-based scoring approach (interest/tag matches, budget fit,
    // rating/popularity) via /api/catalog/:category/generate.
    try {
      const slug = CATEGORY_TO_SLUG[category];
      const budgetUsd = budget
        ? Number(budget.replace(/[^0-9.]/g, "")) || undefined
        : undefined;
      const data = await api.generateCatalogRecommendations(slug, {
        interests,
        purpose,
        budgetUsd,
        topN: 9,
      });
      const mapped: Recommendation[] = data.recommendations.map((item: any) => ({
        title: item.title,
        description: item.description,
        reason: item.reason,
        rating: Number(item.avg_rating) || Number(item.popularity_score) || 8,
        tags: (item.tags || "").split(",").filter(Boolean).slice(0, 3),
        pros: Array.isArray(item.pros) ? item.pros : JSON.parse(item.pros || "[]"),
        cons: Array.isArray(item.cons) ? item.cons : JSON.parse(item.cons || "[]"),
        price: item.price_label || "Varies",
        emoji: item.emoji || "✨",
      }));
      setLoading(false);
      onResults(mapped, { category, interests, purpose });
    } catch (err: any) {
      setLoading(false);
      setGenError(
        err.message ||
          "Could not reach the recommendation API. Is the backend running?",
      );
    }
  }

  return (
    <div className="p-8 relative">
      <GradientOrb className="w-[400px] h-[400px] bg-violet-700 top-[-100px] right-[-50px]" />
      <div className="relative z-10 max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[var(--fg)]/40 hover:text-[var(--fg)] mb-8 transition-colors"
        >
          <ChevronLeft size={15} /> Back to dashboard
        </button>
        <h1 className="text-3xl font-extrabold mb-2">Get Recommendations</h1>
        <p className="text-[var(--fg)]/50 text-sm mb-8">
          Tell us about your preferences and we'll find the perfect picks.
        </p>
        <GlassCard className="p-7">
          <div className="flex flex-col gap-5">
            <div ref={dropRef}>
              <label className="text-sm font-medium text-[var(--fg)]/70 mb-1.5 block">
                Category
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  className="w-full flex items-center justify-between bg-[var(--fg)]/6 border border-[var(--border)]/10 rounded-xl px-4 py-3 text-sm text-[var(--fg)] hover:border-[var(--border)]/20 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-violet-400">
                      {CATEGORY_ICONS[category]}
                    </span>{" "}
                    {category}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-[var(--fg)]/40 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {open && (
                  <div className="absolute top-full mt-1.5 w-full bg-[var(--surface-solid-2)] border border-[var(--border)]/10 rounded-xl overflow-hidden z-30 shadow-2xl max-h-64 overflow-y-auto">
                    {(Object.keys(CATEGORY_ICONS) as Category[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategory(cat);
                          setOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--fg)]/6 transition-colors text-left ${cat === category ? "text-violet-300" : "text-[var(--fg)]/70"}`}
                      >
                        <span className="text-violet-400">
                          {CATEGORY_ICONS[cat]}
                        </span>{" "}
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <InputField
              label="Budget (optional)"
              type="text"
              value={budget}
              onChange={setBudget}
              placeholder="e.g. Under $20, $500–$1000"
            />
            <InputField
              label="Location (optional)"
              type="text"
              value={location}
              onChange={setLocation}
              placeholder="e.g. New York, Remote, Europe"
            />
            <InputField
              label="Interests & genres"
              type="text"
              value={interests}
              onChange={setInterests}
              placeholder="e.g. sci-fi, action, thriller"
            />
            <InputField
              label="Purpose"
              type="text"
              value={purpose}
              onChange={setPurpose}
              placeholder="e.g. relaxing weekend, career growth, gift idea"
            />
            {user.plan === "free" && user.credits > 0 && (
              <div className="flex items-center gap-2 bg-violet-500/8 border border-violet-400/15 rounded-xl px-4 py-3">
                <Zap size={14} className="text-violet-400 shrink-0" />
                <p className="text-xs text-violet-300">
                  This will use <span className="font-bold">1 credit</span>. You
                  have <span className="font-bold">{user.credits}</span>{" "}
                  remaining.
                </p>
              </div>
            )}
            {genError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2.5 text-xs text-red-300">
                <AlertTriangle size={13} className="shrink-0" /> {genError}
              </div>
            )}
            <PrimaryButton
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Generating
                  with AI…
                </>
              ) : (
                <>
                  <Sparkles size={15} /> Generate Recommendations
                </>
              )}
            </PrimaryButton>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Results ─────────────────────────────────────────────────────────────────

function ResultsPage({
  recommendations,
  user,
  category,
  onBack,
  onShowSub,
  onUpdateUser,
  onSaveItem,
  savedIds,
  toast,
}: {
  recommendations: Recommendation[];
  user: UserProfile;
  category: Category;
  onBack: () => void;
  onShowSub: () => void;
  onUpdateUser: (u: UserProfile) => void;
  onSaveItem: (rec: Recommendation, historyId: string) => void;
  savedIds: Set<string>;
  toast: (msg: string, type?: Toast["type"]) => void;
}) {
  const historyId = useRef(`h-${Date.now()}`);

  useEffect(() => {
    if (user.plan === "free" && user.credits > 0)
      onUpdateUser({ ...user, credits: user.credits - 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-8 relative">
      <GradientOrb className="w-[400px] h-[400px] bg-violet-700 top-[-100px] right-[-50px]" />
      <div className="relative z-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-[var(--fg)]/40 hover:text-[var(--fg)] transition-colors"
          >
            <ChevronLeft size={15} /> Back
          </button>
          <CreditBadge credits={user.credits} plan={user.plan} />
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Your Recommendations</h1>
        <p className="text-[var(--fg)]/40 text-sm mb-8">
          AI found {recommendations.length} perfect picks in{" "}
          <span className="text-violet-400 font-semibold">{category}</span>.
        </p>
        <div className="flex flex-col gap-5">
          {recommendations.map((rec, i) => {
            const sid = `${historyId.current}-${i}`;
            const isSaved = savedIds.has(sid);
            return (
              <GlassCard key={i} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-400/15 flex items-center justify-center text-2xl shrink-0">
                    {rec.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <h3 className="font-bold text-base">{rec.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star
                          size={12}
                          className="text-amber-400 fill-amber-400"
                        />
                        <span className="text-xs font-bold text-amber-300">
                          {rec.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--fg)]/50 mb-2 leading-relaxed">
                      {rec.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {rec.tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs bg-violet-500/10 border border-violet-400/20 text-violet-300 px-2.5 py-0.5 rounded-full"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="bg-violet-500/8 border border-violet-400/15 rounded-xl px-3.5 py-2.5 mb-3">
                      <p className="text-xs font-medium text-violet-300 mb-0.5">
                        Why AI recommended it
                      </p>
                      <p className="text-xs text-[var(--fg)]/50">{rec.reason}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-green-400 mb-1.5">
                          Pros
                        </p>
                        {rec.pros.map((p) => (
                          <p
                            key={p}
                            className="text-xs text-[var(--fg)]/50 flex items-start gap-1.5 mb-1"
                          >
                            <Check
                              size={10}
                              className="text-green-400 mt-0.5 shrink-0"
                            />
                            {p}
                          </p>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-red-400 mb-1.5">
                          Cons
                        </p>
                        {rec.cons.map((c) => (
                          <p
                            key={c}
                            className="text-xs text-[var(--fg)]/50 flex items-start gap-1.5 mb-1"
                          >
                            <X
                              size={10}
                              className="text-red-400 mt-0.5 shrink-0"
                            />
                            {c}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]/6">
                      <span className="text-xs font-medium text-[var(--fg)]/50">
                        {rec.price}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${rec.title} — ${rec.description}`,
                            );
                            toast("Copied to clipboard!");
                          }}
                          className="p-1.5 rounded-lg text-[var(--fg)]/30 hover:text-[var(--fg)]/70 hover:bg-[var(--fg)]/6 transition-all"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => toast("Link shared!", "info")}
                          className="p-1.5 rounded-lg text-[var(--fg)]/30 hover:text-[var(--fg)]/70 hover:bg-[var(--fg)]/6 transition-all"
                        >
                          <Share2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            onSaveItem(rec, historyId.current);
                            toast(
                              isSaved ? "Removed from saved" : "Saved!",
                              "success",
                            );
                          }}
                          className={`p-1.5 rounded-lg transition-all ${isSaved ? "text-violet-400 bg-violet-500/15" : "text-[var(--fg)]/30 hover:text-[var(--fg)]/70 hover:bg-[var(--fg)]/6"}`}
                        >
                          <Bookmark
                            size={13}
                            className={isSaved ? "fill-violet-400" : ""}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
        {user.plan === "free" && user.credits <= 0 && (
          <div className="mt-8 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 p-6 text-center">
            <Crown size={24} className="text-amber-400 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">
              Want more recommendations?
            </h3>
            <p className="text-sm text-[var(--fg)]/50 mb-5">
              You've used all your free credits. Upgrade to Pro for unlimited AI
              recommendations.
            </p>
            <button
              onClick={onShowSub}
              className="px-6 py-3 rounded-xl font-semibold text-black bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 transition-all text-sm"
            >
              Upgrade to Pro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── History ─────────────────────────────────────────────────────────────────

function HistoryPage({
  history,
  onViewEntry,
  onClear,
  toast,
}: {
  history: HistoryEntry[];
  onViewEntry: (entry: HistoryEntry) => void;
  onClear: () => void;
  toast: (msg: string, type?: Toast["type"]) => void;
}) {
  return (
    <div className="p-8 relative">
      <GradientOrb className="w-[300px] h-[300px] bg-blue-700 top-[-50px] right-[-50px]" />
      <div className="relative z-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold mb-1">
              Recommendation History
            </h1>
            <p className="text-sm text-[var(--fg)]/40">
              {history.length} session{history.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => {
                onClear();
                toast("History cleared", "info");
              }}
              className="flex items-center gap-2 text-xs font-medium text-[var(--fg)]/35 hover:text-red-400 hover:bg-red-500/8 px-3 py-2 rounded-xl transition-all border border-[var(--border)]/8"
            >
              <Trash2 size={13} /> Clear all
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <div className="text-center py-24">
            <HistoryIcon size={40} className="text-[var(--fg)]/15 mx-auto mb-4" />
            <p className="text-[var(--fg)]/40 font-medium mb-1">No history yet</p>
            <p className="text-sm text-[var(--fg)]/25">
              Your recommendation sessions will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((entry) => (
              <GlassCard
                key={entry.id}
                className="p-5 flex items-start gap-4"
                onClick={() => onViewEntry(entry)}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${CATEGORY_COLORS[entry.category]}22`,
                    border: `1px solid ${CATEGORY_COLORS[entry.category]}33`,
                  }}
                >
                  <span style={{ color: CATEGORY_COLORS[entry.category] }}>
                    {CATEGORY_ICONS[entry.category]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">
                      {entry.category} Recommendations
                    </p>
                    <span className="text-xs text-[var(--fg)]/30 flex items-center gap-1">
                      <Clock size={11} /> {entry.date}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--fg)]/45 truncate mb-2">
                    {[entry.interests, entry.purpose]
                      .filter(Boolean)
                      .join(" · ") || "General request"}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[var(--fg)]/30 bg-[var(--fg)]/5 px-2 py-0.5 rounded">
                      {entry.results.length} results
                    </span>
                    {entry.savedCount > 0 && (
                      <span className="text-xs flex items-center gap-1 text-violet-400">
                        <Bookmark size={11} /> {entry.savedCount} saved
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight
                  size={15}
                  className="text-[var(--fg)]/25 shrink-0 mt-1"
                />
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Saved ────────────────────────────────────────────────────────────────────

interface KidsActivity {
  id: number;
  title: string;
  activity_type: string;
  min_age: number;
  max_age: number;
  safety_notes: string | null;
  description: string;
  destination_name: string;
  country: string;
}

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  theme_park: "Theme Park",
  educational: "Educational",
  wildlife: "Wildlife",
  beach: "Beach",
  adventure_mild: "Mild Adventure",
  museum: "Museum",
  water_park: "Water Park",
};

interface KidsCatalogItem {
  id: number;
  category: string;
  title: string;
  description: string;
  tags: string | null;
  price_label: string | null;
  emoji: string | null;
  avg_rating: number;
  age_group: string | null;
}

const KIDS_CATALOG_CATEGORY_LABEL: Record<string, string> = {
  movies: "Movies",
  books: "Books",
  electronics: "Electronics",
  courses: "Courses",
  fashion: "Fashion",
  restaurants: "Restaurants",
  games: "Games",
  music: "Music",
};

const KIDS_CATALOG_CATEGORY_ICON: Record<string, React.ReactNode> = {
  movies: <Star size={14} />,
  books: <BookOpen size={14} />,
  electronics: <Laptop size={14} />,
  courses: <Brain size={14} />,
  fashion: <ShoppingBag size={14} />,
  restaurants: <Utensils size={14} />,
  games: <Gamepad2 size={14} />,
  music: <Music size={14} />,
};

function KidsPage({
  toast,
}: {
  toast: (msg: string, type?: Toast["type"]) => void;
}) {
  const [tab, setTab] = useState<"travel" | "catalog">("travel");
  const [childAge, setChildAge] = useState(6);
  const [activities, setActivities] = useState<KidsActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [catalogCategory, setCatalogCategory] = useState<string>("");
  const [catalogItems, setCatalogItems] = useState<KidsCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg("");
    api
      .getKidsForAge(childAge)
      .then((data) => {
        if (!cancelled) setActivities(data.activities || []);
      })
      .catch((err) => {
        if (!cancelled)
          setErrorMsg(err.message || "Could not load kid-friendly activities.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [childAge]);

  useEffect(() => {
    if (tab !== "catalog") return;
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError("");
    api
      .getKidsCatalog(catalogCategory || undefined)
      .then((data) => {
        if (!cancelled) setCatalogItems(data.items || []);
      })
      .catch((err) => {
        if (!cancelled)
          setCatalogError(err.message || "Could not load kids content.");
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, catalogCategory]);

  return (
    <div className="p-8 relative">
      <GradientOrb className="w-[320px] h-[320px] bg-blue-700 top-[-60px] right-[-60px]" />
      <div className="relative z-10 max-w-4xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center shrink-0">
            <Gamepad2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold mb-1">Kids &amp; Family</h1>
            <p className="text-sm text-[var(--fg)]/40">
              Safe, age-based travel activities plus movies, books, games and
              more just for kids.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("travel")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "travel" ? "border-violet-400/40 bg-violet-500/15 text-violet-300" : "border-[var(--border)]/10 text-[var(--fg)]/50 hover:border-[var(--border)]/20"}`}
          >
            Travel Activities
          </button>
          <button
            onClick={() => setTab("catalog")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === "catalog" ? "border-violet-400/40 bg-violet-500/15 text-violet-300" : "border-[var(--border)]/10 text-[var(--fg)]/50 hover:border-[var(--border)]/20"}`}
          >
            Movies, Books &amp; More
          </button>
        </div>

        {tab === "travel" ? (
          <>
            <GlassCard className="p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="text-sm font-medium text-[var(--fg)]/70 shrink-0">
                Child's age
              </label>
              <input
                type="range"
                min={0}
                max={17}
                value={childAge}
                onChange={(e) => setChildAge(Number(e.target.value))}
                className="flex-1 accent-violet-500"
              />
              <span className="text-sm font-bold text-violet-300 w-16 text-center">
                {childAge} yrs
              </span>
            </GlassCard>

            {errorMsg && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/20 rounded-lg px-4 py-3 text-xs text-red-300 mb-6">
                <AlertTriangle size={14} className="shrink-0" />
                {errorMsg} — make sure the backend API is running (see
                README) and try again.
              </div>
            )}

            {loading ? (
              <div className="text-center py-20 text-[var(--fg)]/40 text-sm">
                Loading age-appropriate activities…
              </div>
            ) : activities.length === 0 && !errorMsg ? (
              <div className="text-center py-20">
                <Gamepad2 size={36} className="text-[var(--fg)]/15 mx-auto mb-3" />
                <p className="text-[var(--fg)]/40 text-sm">
                  No activities found for this age yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activities.map((a) => (
                  <GlassCard key={a.id} className="p-5 flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{a.title}</p>
                        <p className="text-xs text-[var(--fg)]/35">
                          {a.destination_name}, {a.country}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-violet-500/15 text-violet-300 shrink-0">
                        {ACTIVITY_TYPE_LABEL[a.activity_type] || a.activity_type}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--fg)]/50 leading-relaxed">
                      {a.description}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--fg)]/35 pt-2 border-t border-[var(--border)]/6">
                      <Shield size={12} className="text-emerald-400 shrink-0" />
                      <span>
                        Ages {a.min_age}–{a.max_age}
                        {a.safety_notes ? ` · ${a.safety_notes}` : ""}
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setCatalogCategory("")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${catalogCategory === "" ? "border-violet-400/40 bg-violet-500/15 text-violet-300" : "border-[var(--border)]/10 text-[var(--fg)]/50 hover:border-[var(--border)]/20"}`}
              >
                All
              </button>
              {Object.entries(KIDS_CATALOG_CATEGORY_LABEL).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCatalogCategory(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${catalogCategory === key ? "border-violet-400/40 bg-violet-500/15 text-violet-300" : "border-[var(--border)]/10 text-[var(--fg)]/50 hover:border-[var(--border)]/20"}`}
                >
                  {KIDS_CATALOG_CATEGORY_ICON[key]} {label}
                </button>
              ))}
            </div>

            {catalogError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/20 rounded-lg px-4 py-3 text-xs text-red-300 mb-6">
                <AlertTriangle size={14} className="shrink-0" />
                {catalogError} — make sure the backend API is running (see
                README) and try again.
              </div>
            )}

            {catalogLoading ? (
              <div className="text-center py-20 text-[var(--fg)]/40 text-sm">
                Loading kids content…
              </div>
            ) : catalogItems.length === 0 && !catalogError ? (
              <div className="text-center py-20">
                <BookOpen size={36} className="text-[var(--fg)]/15 mx-auto mb-3" />
                <p className="text-[var(--fg)]/40 text-sm">
                  No kids content found in this category yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalogItems.map((it) => (
                  <GlassCard key={it.id} className="p-5 flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{it.emoji}</span>
                        <p className="font-semibold text-sm">{it.title}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-violet-500/15 text-violet-300 shrink-0">
                        {KIDS_CATALOG_CATEGORY_LABEL[it.category] || it.category}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--fg)]/50 leading-relaxed">
                      {it.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[var(--fg)]/35 pt-2 border-t border-[var(--border)]/6">
                      <span className="flex items-center gap-1">
                        <Star size={11} className="text-amber-400" />
                        {it.avg_rating}
                      </span>
                      {it.age_group && (
                        <span className="flex items-center gap-1">
                          <Shield size={11} className="text-emerald-400" />
                          Ages {it.age_group}
                        </span>
                      )}
                      {it.price_label && <span>{it.price_label}</span>}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SavedPage({
  saved,
  onRemove,
  toast,
}: {
  saved: SavedItem[];
  onRemove: (historyId: string, title: string) => void;
  toast: (msg: string, type?: Toast["type"]) => void;
}) {
  const [filter, setFilter] = useState<Category | "All">("All");
  const categories = [
    "All",
    ...Array.from(new Set(saved.map((s) => s.category))),
  ] as (Category | "All")[];
  const filtered =
    filter === "All" ? saved : saved.filter((s) => s.category === filter);

  return (
    <div className="p-8 relative">
      <GradientOrb className="w-[300px] h-[300px] bg-violet-700 top-[-50px] right-[-50px]" />
      <div className="relative z-10 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold mb-1">Saved Items</h1>
          <p className="text-sm text-[var(--fg)]/40">
            {saved.length} bookmark{saved.length !== 1 ? "s" : ""} across all
            categories
          </p>
        </div>
        {saved.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === cat ? "bg-violet-500/20 border border-violet-400/30 text-violet-300" : "bg-[var(--fg)]/5 border border-[var(--border)]/8 text-[var(--fg)]/40 hover:text-[var(--fg)]/70"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <Bookmark size={40} className="text-[var(--fg)]/15 mx-auto mb-4" />
            <p className="text-[var(--fg)]/40 font-medium mb-1">
              {saved.length === 0
                ? "Nothing saved yet"
                : "No items in this category"}
            </p>
            <p className="text-sm text-[var(--fg)]/25">
              Bookmark recommendations from your results to see them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item, i) => (
              <GlassCard key={i} className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.rec.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm">{item.rec.title}</p>
                      <p className="text-xs text-[var(--fg)]/35">
                        {item.category} · {item.savedAt}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onRemove(item.historyId, item.rec.title);
                      toast("Removed from saved", "info");
                    }}
                    className="text-[var(--fg)]/20 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-[var(--fg)]/45 leading-relaxed line-clamp-2">
                  {item.rec.description}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/6">
                  <div className="flex items-center gap-1">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-amber-300">
                      {item.rec.rating}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--fg)]/35">
                    {item.rec.price}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

function AnalyticsPage({
  history,
  user,
}: {
  history: HistoryEntry[];
  user: UserProfile;
}) {
  const totalRecs = history.reduce((s, h) => s + h.results.length, 0);
  const totalSaved = history.reduce((s, h) => s + h.savedCount, 0);

  const byCat = (Object.keys(CATEGORY_ICONS) as Category[])
    .map((cat) => ({
      name: cat,
      count: history.filter((h) => h.category === cat).length,
      color: CATEGORY_COLORS[cat],
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);

  const pieData = byCat.slice(0, 5);

  return (
    <div className="p-8 relative">
      <GradientOrb className="w-[300px] h-[300px] bg-indigo-700 top-[-50px] right-[-50px]" />
      <div className="relative z-10 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold mb-1">Analytics</h1>
          <p className="text-sm text-[var(--fg)]/40">
            Your recommendation usage at a glance
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Sessions",
              value: history.length,
              icon: <HistoryIcon size={16} />,
              color: "violet",
            },
            {
              label: "AI Results",
              value: totalRecs,
              icon: <Sparkles size={16} />,
              color: "blue",
            },
            {
              label: "Saved",
              value: totalSaved,
              icon: <Bookmark size={16} />,
              color: "amber",
            },
            {
              label: "Credits Left",
              value: user.plan === "pro" ? "∞" : user.credits,
              icon: <Zap size={16} />,
              color: "green",
            },
          ].map((s) => (
            <GlassCard key={s.label} className="p-4">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.color === "violet" ? "bg-violet-500/20 text-violet-400" : s.color === "blue" ? "bg-blue-500/20 text-blue-400" : s.color === "amber" ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"}`}
              >
                {s.icon}
              </div>
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs text-[var(--fg)]/40 mt-0.5">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-16">
            <BarChart2 size={40} className="text-[var(--fg)]/15 mx-auto mb-4" />
            <p className="text-[var(--fg)]/40 font-medium mb-1">No data yet</p>
            <p className="text-sm text-[var(--fg)]/25">
              Generate some recommendations to see your analytics.
            </p>
          </div>
        ) : (
          <>
            {/* Weekly chart */}
            <GlassCard className="p-6 mb-5">
              <h3 className="text-sm font-bold text-[var(--fg)]/60 uppercase tracking-widest mb-5">
                Weekly Activity
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={ANALYTICS_WEEKLY}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#9090b0", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#12122a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#f0f0ff",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="recs"
                    stroke="#7c3aed"
                    fill="url(#grad)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Category breakdown */}
            {byCat.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <GlassCard className="p-6">
                  <h3 className="text-sm font-bold text-[var(--fg)]/60 uppercase tracking-widest mb-5">
                    By Category
                  </h3>
                  <div className="flex flex-col gap-3">
                    {byCat.map((d) => (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-[var(--fg)]/50 w-24 shrink-0">
                          {d.name}
                        </span>
                        <div className="flex-1 h-2 bg-[var(--fg)]/8 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(d.count / Math.max(...byCat.map((x) => x.count))) * 100}%`,
                              background: d.color,
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-[var(--fg)]/35 w-4 text-right">
                          {d.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
                {pieData.length >= 2 && (
                  <GlassCard className="p-6">
                    <h3 className="text-sm font-bold text-[var(--fg)]/60 uppercase tracking-widest mb-5">
                      Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          dataKey="count"
                          paddingAngle={3}
                        >
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#12122a",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 12,
                            color: "#f0f0ff",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                      {pieData.map((d) => (
                        <div key={d.name} className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: d.color }}
                          />
                          <span className="text-xs text-[var(--fg)]/40">
                            {d.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function ProfilePage({
  user,
  onUpdateUser,
  onNavigate,
  history,
  saved,
  toast,
}: {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onNavigate: (p: Page) => void;
  history: HistoryEntry[];
  saved: SavedItem[];
  toast: (msg: string, type?: Toast["type"]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio,
    location: user.location,
    website: user.website,
  });

  function save() {
    onUpdateUser({
      ...user,
      ...form,
      avatar: form.name
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    });
    setEditing(false);
    toast("Profile updated!", "success");
  }

  return (
    <div className="p-8 relative">
      <GradientOrb className="w-[300px] h-[300px] bg-violet-700 top-[-50px] right-[-50px]" />
      <div className="relative z-10 max-w-2xl">
        <h1 className="text-2xl font-extrabold mb-8">Profile</h1>

        {/* Avatar + header */}
        <GlassCard className="p-7 mb-5">
          <div className="flex items-start gap-5 flex-wrap">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl font-extrabold shadow-lg shadow-violet-900/40">
                {user.avatar}
              </div>
              <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[var(--surface-solid-2)] border border-[var(--border)]/15 flex items-center justify-center text-[var(--fg)]/50 hover:text-[var(--fg)] transition-colors">
                <Camera size={13} />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex flex-col gap-3">
                  <InputField
                    label="Full name"
                    type="text"
                    value={form.name}
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  />
                  <InputField
                    label="Bio"
                    type="text"
                    value={form.bio}
                    onChange={(v) => setForm((f) => ({ ...f, bio: v }))}
                    textarea
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Location"
                      type="text"
                      value={form.location}
                      onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                      icon={<Globe size={13} />}
                    />
                    <InputField
                      label="Website"
                      type="text"
                      value={form.website}
                      onChange={(v) => setForm((f) => ({ ...f, website: v }))}
                    />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <PrimaryButton onClick={save} className="text-sm py-2 px-4">
                      Save changes
                    </PrimaryButton>
                    <button
                      onClick={() => {
                        setForm({
                          name: user.name,
                          bio: user.bio,
                          location: user.location,
                          website: user.website,
                        });
                        setEditing(false);
                      }}
                      className="px-4 py-2 text-sm font-medium text-[var(--fg)]/50 hover:text-[var(--fg)] border border-[var(--border)]/10 hover:border-[var(--border)]/20 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-extrabold">{user.name}</h2>
                    {user.plan === "pro" && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/15 border border-amber-400/20 px-2 py-0.5 rounded-full">
                        <Crown size={11} /> Pro
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--fg)]/50 mb-2">{user.email}</p>
                  <p className="text-sm text-[var(--fg)]/60 mb-3 leading-relaxed">
                    {user.bio}
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mb-3">
                    {user.location && (
                      <span className="text-xs text-[var(--fg)]/40 flex items-center gap-1">
                        <Globe size={11} /> {user.location}
                      </span>
                    )}
                    {user.website && (
                      <span className="text-xs text-[var(--fg)]/40">
                        {user.website}
                      </span>
                    )}
                    <span className="text-xs text-[var(--fg)]/40 flex items-center gap-1">
                      <Clock size={11} /> Joined {user.joinDate}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <Edit3 size={12} /> Edit profile
                  </button>
                </>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            {
              label: "Sessions",
              value: history.length,
              icon: <HistoryIcon size={14} />,
            },
            {
              label: "Saved items",
              value: saved.length,
              icon: <Bookmark size={14} />,
            },
            {
              label: "Credits used",
              value: user.plan === "pro" ? "∞" : FREE_CREDITS - user.credits,
              icon: <Zap size={14} />,
            },
          ].map((s) => (
            <GlassCard key={s.label} className="p-4 text-center">
              <div className="text-violet-400 flex justify-center mb-2">
                {s.icon}
              </div>
              <p className="text-xl font-extrabold">{s.value}</p>
              <p className="text-xs text-[var(--fg)]/40">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Plan card */}
        <GlassCard
          className={`p-5 ${user.plan === "pro" ? "border-amber-400/20 bg-gradient-to-r from-amber-500/8 to-yellow-500/5" : "border-violet-400/20"}`}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${user.plan === "pro" ? "bg-amber-500/20" : "bg-violet-500/20"}`}
              >
                {user.plan === "pro" ? (
                  <Crown size={18} className="text-amber-400" />
                ) : (
                  <Zap size={18} className="text-violet-400" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm">
                  {user.plan === "pro" ? "Pro Plan" : "Free Plan"}
                </p>
                <p className="text-xs text-[var(--fg)]/40">
                  {user.plan === "pro"
                    ? "Unlimited recommendations · All features"
                    : `${user.credits} of ${FREE_CREDITS} credits remaining`}
                </p>
              </div>
            </div>
            {user.plan === "free" ? (
              <button
                onClick={() => onNavigate("settings")}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 transition-all"
              >
                Upgrade to Pro
              </button>
            ) : (
              <span className="text-xs text-[var(--fg)]/35">Renews monthly</span>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsPage({
  user,
  onUpdateUser,
  onLogout,
  onAccountDeleted,
  onShowSub,
  onCancelSubscription,
  onResumeSubscription,
  onDownloadInvoice,
  toast,
  theme,
  onToggleTheme,
}: {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  onLogout: () => void;
  onAccountDeleted: () => void;
  onShowSub: () => void;
  onCancelSubscription: () => Promise<void>;
  onResumeSubscription: () => Promise<void>;
  onDownloadInvoice: () => Promise<void>;
  toast: (msg: string, type?: Toast["type"]) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [section, setSection] = useState<
    "account" | "notifications" | "security" | "billing"
  >("account");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    bio: user.bio,
    location: user.location,
    website: user.website,
  });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  function saveAccount() {
    onUpdateUser({
      ...user,
      ...form,
      avatar: form.name
        .split(" ")
        .map((p: string) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    });
    toast("Account settings saved!", "success");
  }
  function savePassword() {
    if (!pw.current) {
      toast("Enter your current password", "error");
      return;
    }
    if (pw.next.length < 6) {
      toast("New password must be at least 6 characters", "error");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast("Passwords do not match", "error");
      return;
    }
    setPw({ current: "", next: "", confirm: "" });
    toast("Password updated!", "success");
  }
  function toggleNotif(key: keyof typeof user.notifications) {
    onUpdateUser({
      ...user,
      notifications: { ...user.notifications, [key]: !user.notifications[key] },
    });
  }

  const sections = [
    { id: "account", label: "Account" },
    { id: "notifications", label: "Notifications" },
    { id: "security", label: "Security" },
    { id: "billing", label: "Billing" },
  ] as const;

  return (
    <div className="p-8 relative">
      <GradientOrb className="w-[300px] h-[300px] bg-blue-700 top-[-50px] right-[-50px]" />
      <div className="relative z-10 max-w-2xl">
        <h1 className="text-2xl font-extrabold mb-8">Settings</h1>
        <div className="flex gap-1 flex-wrap mb-8 bg-[var(--fg)]/4 border border-[var(--border)]/8 rounded-2xl p-1.5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id as typeof section)}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${section === s.id ? "bg-violet-500/20 text-violet-300 border border-violet-400/25" : "text-[var(--fg)]/40 hover:text-[var(--fg)]/70"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {section === "account" && (
          <div className="flex flex-col gap-5">
            <GlassCard className="p-6">
              <h3 className="text-sm font-bold text-[var(--fg)]/60 uppercase tracking-widest mb-5">
                Personal Information
              </h3>
              <div className="flex flex-col gap-4">
                <InputField
                  label="Full name"
                  type="text"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  icon={<UserIcon size={14} />}
                />
                <InputField
                  label="Email address"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  icon={<Mail size={14} />}
                />
                <InputField
                  label="Bio"
                  type="text"
                  value={form.bio}
                  onChange={(v) => setForm((f) => ({ ...f, bio: v }))}
                  textarea
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Location"
                    type="text"
                    value={form.location}
                    onChange={(v) => setForm((f) => ({ ...f, location: v }))}
                    icon={<Globe size={14} />}
                  />
                  <InputField
                    label="Website"
                    type="text"
                    value={form.website}
                    onChange={(v) => setForm((f) => ({ ...f, website: v }))}
                  />
                </div>
                <PrimaryButton
                  onClick={saveAccount}
                  className="self-start text-sm py-2.5 px-5"
                >
                  Save changes
                </PrimaryButton>
              </div>
            </GlassCard>
            <GlassCard className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                    {theme === "dark" ? (
                      <Moon size={16} className="text-violet-400" />
                    ) : (
                      <Sun size={16} className="text-violet-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--fg)]/80">
                      Appearance
                    </p>
                    <p className="text-xs text-[var(--fg)]/40 mt-0.5">
                      {theme === "dark" ? "Dark mode" : "Light mode"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onToggleTheme}
                  className={`w-14 h-7 rounded-full border transition-all flex items-center px-1 ${theme === "dark" ? "bg-violet-500/30 border-violet-400/40 justify-end" : "bg-[var(--fg)]/10 border-[var(--border)]/15 justify-start"}`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow flex items-center justify-center">
                    {theme === "dark" ? (
                      <Moon size={11} className="text-violet-600" />
                    ) : (
                      <Sun size={11} className="text-amber-500" />
                    )}
                  </div>
                </button>
              </div>
            </GlassCard>
            <GlassCard className="p-5 border-red-400/15">
              <h3 className="text-sm font-bold text-red-400/70 uppercase tracking-widest mb-4">
                Danger Zone
              </h3>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--fg)]/70">
                    Delete account
                  </p>
                  <p className="text-xs text-[var(--fg)]/35 mt-0.5">
                    Permanently delete your account and all data.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 text-xs font-semibold text-red-400 border border-red-400/25 rounded-xl hover:bg-red-500/10 transition-all"
                >
                  Delete account
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => !deleting && setShowDeleteModal(false)}
            />
            <div className="relative z-10 w-full max-w-sm">
              <GlassCard className="p-6 border-red-400/25 bg-[var(--surface-solid-1)]">
                <h3 className="font-bold text-lg mb-1 text-red-400">
                  Delete your account?
                </h3>
                <p className="text-xs text-[var(--fg)]/50 mb-5 leading-relaxed">
                  This permanently deletes your account, history, saved items,
                  wishlist and reviews. This cannot be undone. Enter your
                  password to confirm.
                </p>
                <InputField
                  label="Password"
                  type="password"
                  value={deletePassword}
                  onChange={setDeletePassword}
                  placeholder="Your account password"
                  icon={<Lock size={14} />}
                />
                {deleteError && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2.5 text-xs text-red-300 mt-3">
                    <X size={13} className="shrink-0" /> {deleteError}
                  </div>
                )}
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={async () => {
                      setDeleteError("");
                      if (!deletePassword) {
                        setDeleteError("Password is required.");
                        return;
                      }
                      setDeleting(true);
                      try {
                        await api.deleteAccount(deletePassword);
                        onAccountDeleted();
                      } catch (err: any) {
                        setDeleteError(
                          err.message || "Could not delete account.",
                        );
                        setDeleting(false);
                      }
                    }}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Yes, delete permanently"}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword("");
                      setDeleteError("");
                    }}
                    disabled={deleting}
                    className="px-4 py-2.5 text-sm font-medium text-[var(--fg)]/50 hover:text-[var(--fg)] border border-[var(--border)]/10 hover:border-[var(--border)]/20 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {section === "notifications" && (
          <GlassCard className="p-6">
            <h3 className="text-sm font-bold text-[var(--fg)]/60 uppercase tracking-widest mb-5">
              Notification Preferences
            </h3>
            <div className="flex flex-col gap-5">
              {[
                {
                  key: "email" as const,
                  label: "Email notifications",
                  desc: "Receive updates and results via email",
                },
                {
                  key: "push" as const,
                  label: "Push notifications",
                  desc: "Browser push alerts for new recommendations",
                },
                {
                  key: "weekly" as const,
                  label: "Weekly digest",
                  desc: "A curated summary of your activity each week",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--fg)]/80">
                      {item.label}
                    </p>
                    <p className="text-xs text-[var(--fg)]/40 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      toggleNotif(item.key);
                      toast(
                        `${item.label} ${user.notifications[item.key] ? "disabled" : "enabled"}`,
                        "success",
                      );
                    }}
                    className={`w-11 h-6 rounded-full border transition-all flex items-center ${user.notifications[item.key] ? "bg-violet-500 border-violet-400/50 justify-end" : "bg-[var(--fg)]/10 border-[var(--border)]/15 justify-start"}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full mx-1 shadow" />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {section === "security" && (
          <GlassCard className="p-6">
            <h3 className="text-sm font-bold text-[var(--fg)]/60 uppercase tracking-widest mb-5">
              Change Password
            </h3>
            <div className="flex flex-col gap-4">
              <InputField
                label="Current password"
                type="password"
                value={pw.current}
                onChange={(v) => setPw((p) => ({ ...p, current: v }))}
                icon={<Lock size={14} />}
              />
              <InputField
                label="New password"
                type="password"
                value={pw.next}
                onChange={(v) => setPw((p) => ({ ...p, next: v }))}
                icon={<Lock size={14} />}
              />
              <InputField
                label="Confirm new password"
                type="password"
                value={pw.confirm}
                onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
                icon={<Lock size={14} />}
              />
              <PrimaryButton
                onClick={savePassword}
                className="self-start text-sm py-2.5 px-5"
              >
                Update password
              </PrimaryButton>
            </div>
          </GlassCard>
        )}

        {section === "billing" && (
          <div className="flex flex-col gap-5">
            <GlassCard
              className={`p-6 ${user.plan === "pro" ? "border-amber-400/20 bg-gradient-to-r from-amber-500/8 to-yellow-500/5" : ""}`}
            >
              <h3 className="text-sm font-bold text-[var(--fg)]/60 uppercase tracking-widest mb-5">
                Current Plan
              </h3>
              <div className="flex items-center gap-4 mb-5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user.plan === "pro" ? "bg-amber-500/20" : "bg-violet-500/15"}`}
                >
                  {user.plan === "pro" ? (
                    <Crown size={22} className="text-amber-400" />
                  ) : (
                    <Zap size={22} className="text-violet-400" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-extrabold">
                    {user.plan === "pro" ? "Pro Plan" : "Free Plan"}
                  </p>
                  <p className="text-sm text-[var(--fg)]/45">
                    {user.plan === "pro"
                      ? `$8/month${user.currentPeriodEnd ? ` · Renews ${user.currentPeriodEnd}` : ""}`
                      : "0 USD · No subscription"}
                  </p>
                </div>
              </div>
              {user.plan === "pro" && user.cancelAtPeriodEnd && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2.5 text-xs text-red-300 mb-5">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>
                    Your subscription is <strong>cancelled</strong>. You'll
                    keep Pro access
                    {user.currentPeriodEnd
                      ? ` until ${user.currentPeriodEnd}`
                      : " until the end of this billing period"}
                    , then move to the Free plan automatically.
                  </span>
                </div>
              )}
              {user.plan === "free" ? (
                <PrimaryButton
                  onClick={onShowSub}
                  className="flex items-center gap-2 text-sm py-2.5"
                >
                  <Crown size={14} /> Upgrade to Pro
                </PrimaryButton>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setDownloadingInvoice(true);
                      try {
                        await onDownloadInvoice();
                      } finally {
                        setDownloadingInvoice(false);
                      }
                    }}
                    disabled={downloadingInvoice}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-[var(--border)]/10 text-[var(--fg)]/60 hover:border-[var(--border)]/20 hover:text-[var(--fg)] transition-all disabled:opacity-50"
                  >
                    <Download size={14} />
                    {downloadingInvoice ? "Preparing…" : "Download invoice"}
                  </button>
                  {user.cancelAtPeriodEnd ? (
                    <button
                      onClick={async () => {
                        setCancelling(true);
                        try {
                          await onResumeSubscription();
                        } finally {
                          setCancelling(false);
                        }
                      }}
                      disabled={cancelling}
                      className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-green-400/20 text-green-400/80 hover:bg-green-500/8 transition-all disabled:opacity-50"
                    >
                      {cancelling ? "Resuming…" : "Resume plan"}
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        setCancelling(true);
                        try {
                          await onCancelSubscription();
                        } finally {
                          setCancelling(false);
                        }
                      }}
                      disabled={cancelling}
                      className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-red-400/20 text-red-400/70 hover:bg-red-500/8 transition-all disabled:opacity-50"
                    >
                      {cancelling ? "Cancelling…" : "Cancel plan"}
                    </button>
                  )}
                </div>
              )}
            </GlassCard>
            {user.plan === "free" && (
              <GlassCard className="p-5 border-violet-400/20 bg-gradient-to-r from-violet-500/8 to-blue-500/5">
                <h3 className="text-sm font-bold text-[var(--fg)]/60 uppercase tracking-widest mb-4">
                  Free Credit Usage
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[var(--fg)]/50">
                    Recommendations used
                  </span>
                  <span className="text-xs font-bold text-violet-300">
                    {FREE_CREDITS - user.credits}/{FREE_CREDITS}
                  </span>
                </div>
                <div className="h-2 bg-[var(--fg)]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                    style={{
                      width: `${((FREE_CREDITS - user.credits) / FREE_CREDITS) * 100}%`,
                    }}
                  />
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const stored = localStorage.getItem("sra_theme");
    return stored === "light" ? "light" : "dark";
  });
  const [results, setResults] = useState<{
    recs: Recommendation[];
    category: Category;
  }>({ recs: [], category: "Movies" });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showSub, setShowSub] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [historyEntry, setHistoryEntry] = useState<HistoryEntry | null>(null);
  const [resultsSource, setResultsSource] = useState<"new" | "history">("new");

  // Apply + persist theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sra_theme", theme);
  }, [theme]);
  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  // navigate() keeps the URL in sync with the current page so the browser's
  // Back/Forward buttons and a page refresh both behave correctly, instead
  // of this being a single-URL SPA that ignores browser navigation.
  function navigate(p: Page, replace = false) {
    setPage(p);
    const path = PAGE_TO_PATH[p];
    if (window.location.pathname !== path) {
      if (replace) window.history.replaceState({ page: p }, "", path);
      else window.history.pushState({ page: p }, "", path);
    }
  }

  // Handle browser Back/Forward buttons.
  useEffect(() => {
    function handlePopState() {
      const target = PATH_TO_PAGE[window.location.pathname] || "landing";
      const isProtected = target !== "landing" && target !== "login" && target !== "register";
      if (isProtected && !user) {
        setPage("landing");
      } else {
        setPage(target);
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Restore session on refresh (instead of always bouncing back to the
  // landing/register page), restore the page the URL points to, and handle
  // returning from a Stripe Checkout redirect.
  useEffect(() => {
    async function bootstrap() {
      const params = new URLSearchParams(window.location.search);
      const checkoutStatus = params.get("checkout");
      const sessionId = params.get("session_id");
      const requestedPage = PATH_TO_PAGE[window.location.pathname];

      const hasToken = !!localStorage.getItem("sra_access_token");
      if (hasToken) {
        try {
          const data = await api.me();
          let profile = mapApiUserToProfile(data.user);

          if (checkoutStatus === "success" && sessionId) {
            try {
              const confirmed = await api.confirmCheckoutSession(sessionId);
              profile = mapApiUserToProfile(confirmed.user);
              addToast("Welcome to Pro! Unlimited access unlocked.", "success");
            } catch {
              // Webhook may have already upgraded the account, or payment
              // is still processing — this is not treated as a hard error.
            }
          } else if (checkoutStatus === "cancelled") {
            addToast("Checkout cancelled.", "info");
          }

          setUser(profile);
          // Stay on whatever protected page the URL points to (e.g. refreshing
          // on /kids keeps you on Kids); only fall back to dashboard if the
          // URL was landing/login/register/unknown while already logged in.
          const restorePage =
            requestedPage &&
            requestedPage !== "landing" &&
            requestedPage !== "login" &&
            requestedPage !== "register" &&
            requestedPage !== "results" && // results needs in-memory data we don't have after a refresh
            requestedPage !== "payment" // payment needs the in-memory selected plan
              ? requestedPage
              : "dashboard";
          navigate(restorePage, true);
        } catch {
          clearTokens();
          navigate("landing", true);
        }
      } else if (
        requestedPage &&
        requestedPage !== "landing" &&
        requestedPage !== "login" &&
        requestedPage !== "register"
      ) {
        // Not logged in but URL points at a protected page — send to landing.
        navigate("landing", true);
      }

      if (checkoutStatus) {
        window.history.replaceState({}, "", window.location.pathname);
      }
      setBootstrapping(false);
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addToast(message: string, type: Toast["type"] = "success") {
    const id = `t-${Date.now()}`;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }
  function removeToast(id: string) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  function handleAuth(u: UserProfile) {
    setUser(u);
    navigate("dashboard");
  }
  function handleLogout() {
    api.logout();
    setUser(null);
    setHistory([]);
    setSaved([]);
    setSavedIds(new Set());
    navigate("landing");
  }

  function handleResults(
    recs: Recommendation[],
    meta: { category: Category; interests: string; purpose: string },
  ) {
    const entry: HistoryEntry = {
      id: `h-${Date.now()}`,
      category: meta.category,
      interests: meta.interests,
      purpose: meta.purpose,
      results: recs,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      savedCount: 0,
    };
    setHistory((h) => [entry, ...h]);
    setHistoryEntry(entry);
    setResultsSource("new");
    setResults({ recs, category: meta.category });
    navigate("results");
  }

  function handleSaveItem(rec: Recommendation, historyId: string) {
    const sid = `${historyId}-${results.recs.indexOf(rec)}`;
    if (savedIds.has(sid)) {
      setSavedIds((s) => {
        const n = new Set(s);
        n.delete(sid);
        return n;
      });
      setSaved((s) =>
        s.filter(
          (x) => !(x.rec.title === rec.title && x.historyId === historyId),
        ),
      );
      setHistory((h) =>
        h.map((e) =>
          e.id === historyId
            ? { ...e, savedCount: Math.max(0, e.savedCount - 1) }
            : e,
        ),
      );
    } else {
      setSavedIds((s) => new Set([...s, sid]));
      setSaved((s) => [
        {
          rec,
          category: results.category,
          savedAt: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          historyId,
        },
        ...s,
      ]);
      setHistory((h) =>
        h.map((e) =>
          e.id === historyId ? { ...e, savedCount: e.savedCount + 1 } : e,
        ),
      );
    }
  }

  async function handleUpgrade() {
    try {
      const data = await api.createCheckoutSession();
      window.location.href = data.url; // redirect to real Stripe Checkout
    } catch (err: any) {
      addToast(
        err.message || "Could not start checkout. Please try again.",
        "error",
      );
    }
  }

  function handleGoToPayment(plan: "monthly" | "yearly") {
    setPendingPlan(plan);
    setShowSub(false);
    navigate("payment");
  }

  function handlePaymentSuccess(apiUser: any) {
    setUser(mapApiUserToProfile(apiUser));
    addToast("Upgraded to Pro (demo mode — no real payment).", "success");
    navigate("dashboard");
  }

  async function handleCancelSubscription() {
    try {
      const data = await api.cancelSubscription();
      setUser(mapApiUserToProfile(data.user));
      addToast(
        "Subscription cancelled. Pro access stays active until the end of the billing period.",
        "info",
      );
    } catch (err: any) {
      addToast(
        err.message || "Could not cancel your subscription right now.",
        "error",
      );
    }
  }

  async function handleResumeSubscription() {
    try {
      const data = await api.resumeSubscription();
      setUser(mapApiUserToProfile(data.user));
      addToast("Your subscription has been resumed.", "success");
    } catch (err: any) {
      addToast(
        err.message || "Could not resume your subscription right now.",
        "error",
      );
    }
  }

  async function handleDownloadInvoice() {
    try {
      const data = await api.getInvoice();
      const inv = data.invoice;
      const lines = [
        "SMART RECOMMEND AI",
        "-------------------------------",
        `Invoice #: ${inv.invoiceNumber}`,
        `Date: ${inv.date}`,
        `Billed to: ${inv.customerName} <${inv.customerEmail}>`,
        "-------------------------------",
        `Plan: ${inv.planLabel}`,
        `Amount: ${inv.amount}`,
        `Status: ${inv.status}`,
        "-------------------------------",
        "This is a demo invoice — no real payment was processed.",
      ];
      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${inv.invoiceNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("Invoice downloaded.", "success");
    } catch (err: any) {
      addToast(err.message || "Could not download the invoice.", "error");
    }
  }

  function handleAccountDeleted() {
    clearTokens();
    setUser(null);
    setHistory([]);
    setSaved([]);
    setSavedIds(new Set());
    setShowSub(false);
    navigate("landing");
    addToast("Your account has been deleted.", "info");
  }

  function handleViewHistoryEntry(entry: HistoryEntry) {
    setHistoryEntry(entry);
    setResultsSource("history");
    setResults({ recs: entry.results, category: entry.category });
    navigate("results");
  }

  if (bootstrapping) {
    return (
      <div
        className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div className="flex items-center gap-3 text-[var(--fg)]/40 text-sm">
          <RefreshCw size={16} className="animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  if (page === "landing")
    return (
      <LandingPage
        onLogin={() => {
          setAuthMode("login");
          navigate("login");
        }}
        onRegister={() => {
          setAuthMode("register");
          navigate("register");
        }}
      />
    );
  if (page === "login" || page === "register")
    return (
      <AuthPage
        mode={authMode}
        onSwitch={() =>
          setAuthMode((m) => (m === "login" ? "register" : "login"))
        }
        onAuth={handleAuth}
      />
    );
  if (!user) {
    navigate("landing", true);
    return null;
  }
  if (page === "payment")
    return (
      <PaymentPage
        plan={pendingPlan}
        onSuccess={handlePaymentSuccess}
        onCancel={() => navigate("dashboard")}
        toast={addToast}
      />
    );

  return (
    <>
      <ToastNotification toasts={toasts} remove={removeToast} />
      {showSub && (
        <SubscriptionModal
          onUpgrade={handleUpgrade}
          onGoToPayment={handleGoToPayment}
          onClose={() => setShowSub(false)}
        />
      )}

      {/* Recommend and Results live outside shell (full-page with sidebar) */}
      <AppShell
        user={user}
        page={page}
        onNavigate={navigate}
        onLogout={handleLogout}
        showSub={showSub}
        setShowSub={setShowSub}
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        {page === "dashboard" && (
          <DashboardPage
            user={user}
            onNavigate={navigate}
            setShowSub={setShowSub}
            history={history}
          />
        )}
        {page === "recommend" && (
          <RecommendPage
            user={user}
            onBack={() => navigate("dashboard")}
            onResults={handleResults}
            onShowSub={() => setShowSub(true)}
          />
        )}
        {page === "results" && (
          <ResultsPage
            recommendations={results.recs}
            user={user}
            category={results.category}
            onBack={() => navigate(resultsSource === "history" ? "history" : "dashboard")}
            onShowSub={() => setShowSub(true)}
            onUpdateUser={setUser}
            onSaveItem={handleSaveItem}
            savedIds={savedIds}
            toast={addToast}
          />
        )}
        {page === "kids" && <KidsPage toast={addToast} />}
        {page === "history" && (
          <HistoryPage
            history={history}
            onViewEntry={handleViewHistoryEntry}
            onClear={() => setHistory([])}
            toast={addToast}
          />
        )}
        {page === "saved" && (
          <SavedPage
            saved={saved}
            onRemove={(historyId, title) => {
              setSaved((s) =>
                s.filter(
                  (x) => !(x.rec.title === title && x.historyId === historyId),
                ),
              );
              setHistory((h) =>
                h.map((e) =>
                  e.id === historyId
                    ? { ...e, savedCount: Math.max(0, e.savedCount - 1) }
                    : e,
                ),
              );
            }}
            toast={addToast}
          />
        )}
        {page === "analytics" && (
          <AnalyticsPage history={history} user={user} />
        )}
        {page === "profile" && (
          <ProfilePage
            user={user}
            onUpdateUser={setUser}
            onNavigate={navigate}
            history={history}
            saved={saved}
            toast={addToast}
          />
        )}
        {page === "settings" && (
          <SettingsPage
            user={user}
            onUpdateUser={setUser}
            onLogout={handleLogout}
            onAccountDeleted={handleAccountDeleted}
            onShowSub={() => setShowSub(true)}
            onCancelSubscription={handleCancelSubscription}
            onResumeSubscription={handleResumeSubscription}
            onDownloadInvoice={handleDownloadInvoice}
            toast={addToast}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
      </AppShell>
    </>
  );
}
