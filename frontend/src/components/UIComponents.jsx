import { motion } from 'framer-motion';
import {
    Heart,
    MessageCircle,
    Trophy,
    Sparkles,
    User,
    Mail,
    Lock,
    LogOut,
    Send,
    ArrowRight,
    Loader2
} from 'lucide-react';
import clsx from 'clsx';

// Animated button with glow effect
export function GlowButton({
    children,
    onClick,
    disabled,
    loading,
    variant = 'primary',
    className = '',
    ...props
}) {
    const variants = {
        primary: 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/30',
        secondary: 'bg-white/10 hover:bg-white/20 border border-white/20',
        ghost: 'bg-transparent hover:bg-white/10',
        danger: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 shadow-lg shadow-red-500/30',
    };

    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            onClick={onClick}
            disabled={disabled || loading}
            className={clsx(
                'relative px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300',
                'flex items-center justify-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variants[variant],
                className
            )}
            {...props}
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : children}
        </motion.button>
    );
}

// Animated input with floating label
export function GlowInput({
    type = 'text',
    placeholder,
    value,
    onChange,
    icon: Icon,
    className = ''
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
        >
            {Icon && (
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
            )}
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={clsx(
                    'w-full px-5 py-4 bg-white/5 backdrop-blur-xl rounded-xl',
                    'border border-white/10 focus:border-purple-500/50',
                    'text-white placeholder-gray-500',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500/20',
                    'transition-all duration-300',
                    Icon && 'pl-12',
                    className
                )}
            />
            <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity" />
        </motion.div>
    );
}

// Animated card with glassmorphism
export function GlassCard({ children, className = '', hover = true }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hover ? { y: -4, scale: 1.01 } : {}}
            transition={{ duration: 0.3 }}
            className={clsx(
                'relative p-6 rounded-2xl',
                'bg-white/5 backdrop-blur-xl',
                'border border-white/10',
                'shadow-2xl shadow-black/20',
                className
            )}
        >
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-transparent to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity -z-10" />
            {children}
        </motion.div>
    );
}

// Avatar with gradient border
export function GradientAvatar({ username, size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-14 h-14 text-xl',
    };

    return (
        <div className={clsx(
            'relative p-[2px] rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500',
            className
        )}>
            <div className={clsx(
                'flex items-center justify-center rounded-full bg-gray-900 font-bold text-white',
                sizes[size]
            )}>
                {username?.[0]?.toUpperCase() || '?'}
            </div>
        </div>
    );
}

// Like button with animation
export function LikeButton({ liked, count, onLike, onUnlike }) {
    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={liked ? onUnlike : onLike}
            className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300',
                liked
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-pink-500/10 hover:text-pink-400'
            )}
        >
            <motion.div
                animate={liked ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
            >
                <Heart className={clsx('w-5 h-5', liked && 'fill-current')} />
            </motion.div>
            <span className="font-medium">{count}</span>
        </motion.button>
    );
}

// Rank badge for leaderboard
export function RankBadge({ rank }) {
    const colors = {
        1: 'from-yellow-400 to-orange-500 shadow-yellow-500/50',
        2: 'from-gray-300 to-gray-400 shadow-gray-400/50',
        3: 'from-amber-600 to-amber-700 shadow-amber-600/50',
    };

    return (
        <div className={clsx(
            'flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm',
            rank <= 3
                ? `bg-gradient-to-br ${colors[rank]} shadow-lg text-gray-900`
                : 'bg-white/10 text-gray-400 border border-white/10'
        )}>
            {rank}
        </div>
    );
}

// Karma pill
export function KarmaPill({ karma }) {
    return (
        <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30"
        >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-emerald-400">{karma}</span>
        </motion.div>
    );
}

// Export icons for use in components
export {
    Heart,
    MessageCircle,
    Trophy,
    Sparkles,
    User,
    Mail,
    Lock,
    LogOut,
    Send,
    ArrowRight,
    Loader2
};
