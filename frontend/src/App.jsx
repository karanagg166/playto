import { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GlowButton,
  GlowInput,
  GlassCard,
  GradientAvatar,
  LikeButton,
  RankBadge,
  KarmaPill,
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
} from './components/UIComponents';
import { authAPI, postsAPI, commentsAPI, leaderboardAPI, initCSRF } from './utils/api';

// Lazy load 3D background for performance
const Background3D = lazy(() => import('./components/Background3D'));

// Loading spinner
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="w-12 h-12 text-purple-500" />
      </motion.div>
    </div>
  );
}

// Centered Auth Forms
function AuthForms({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await authAPI.login(username, password);
        onLogin(res.data.user);
      } else {
        const res = await authAPI.register(username, email, password);
        onLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8" hover={false}>
          {/* Logo */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 mb-4 shadow-lg shadow-purple-500/30">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Community Feed
            </h1>
            <p className="text-gray-500 mt-2">
              {isLogin ? 'Welcome back!' : 'Join the community'}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <GlowInput
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={User}
            />

            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <GlowInput
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={Mail}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <GlowInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
            />

            <GlowButton
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!username || !password || (!isLogin && !email)}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="w-5 h-5" />
            </GlowButton>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-gray-400 hover:text-purple-400 transition-colors text-sm"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="text-purple-400 font-semibold">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </span>
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// Header Component
function Header({ user, onLogout }) {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <GlassCard className="flex items-center justify-between py-3 px-6" hover={false}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Community Feed
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <GradientAvatar username={user.username} />
              <span className="text-white font-medium hidden sm:block">{user.username}</span>
            </div>
            <GlowButton variant="ghost" onClick={onLogout} className="px-3">
              <LogOut className="w-5 h-5" />
            </GlowButton>
          </div>
        </GlassCard>
      </div>
    </motion.header>
  );
}

// Create Post Component
function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await initCSRF();
      const res = await postsAPI.create(content);
      onPostCreated(res.data);
      setContent('');
    } catch (err) {
      console.error('Failed to create post', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind? ✨"
          className="w-full p-4 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none min-h-[100px]"
        />
        <div className="flex justify-end mt-4">
          <GlowButton type="submit" loading={loading} disabled={!content.trim()}>
            <Send className="w-5 h-5" />
            Post
          </GlowButton>
        </div>
      </form>
    </GlassCard>
  );
}

// Comment Component (Recursive)
function Comment({ comment, onLike, onUnlike, onReply }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setLoading(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="ml-4 pl-4 border-l border-white/10"
    >
      <div className="py-3">
        <div className="flex items-center gap-2 mb-2">
          <GradientAvatar username={comment.author.username} size="sm" />
          <span className="text-sm font-medium text-gray-300">{comment.author.username}</span>
          <span className="text-xs text-gray-600">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-gray-300 text-sm mb-2">{comment.content}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => comment.is_liked ? onUnlike(comment.id) : onLike(comment.id)}
            className={`flex items-center gap-1 text-xs ${comment.is_liked ? 'text-pink-400' : 'text-gray-500 hover:text-pink-400'} transition-colors`}
          >
            <Heart className={`w-3.5 h-3.5 ${comment.is_liked ? 'fill-current' : ''}`} />
            {comment.like_count}
          </button>
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-xs text-gray-500 hover:text-purple-400 transition-colors"
          >
            Reply
          </button>
        </div>

        <AnimatePresence>
          {showReplyForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex gap-2"
            >
              <input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
              <GlowButton onClick={handleReply} loading={loading} className="px-4 py-2 text-sm">
                Reply
              </GlowButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {comment.children?.map(child => (
        <Comment
          key={child.id}
          comment={child}
          onLike={onLike}
          onUnlike={onUnlike}
          onReply={onReply}
        />
      ))}
    </motion.div>
  );
}

// Post Component
function Post({ post, onUpdate }) {
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLikePost = async () => {
    try {
      const res = await postsAPI.like(post.id);
      onUpdate({ ...post, like_count: res.data.like_count, is_liked: true });
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  const handleUnlikePost = async () => {
    try {
      const res = await postsAPI.unlike(post.id);
      onUpdate({ ...post, like_count: res.data.like_count, is_liked: false });
    } catch (err) {
      console.error('Failed to unlike post', err);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) return;
    setLoading(true);
    try {
      await commentsAPI.create(post.id, commentContent);
      const res = await postsAPI.get(post.id);
      onUpdate(res.data);
      setCommentContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      await commentsAPI.like(commentId);
      const res = await postsAPI.get(post.id);
      onUpdate(res.data);
    } catch (err) {
      console.error('Failed to like comment', err);
    }
  };

  const handleCommentUnlike = async (commentId) => {
    try {
      await commentsAPI.unlike(commentId);
      const res = await postsAPI.get(post.id);
      onUpdate(res.data);
    } catch (err) {
      console.error('Failed to unlike comment', err);
    }
  };

  const handleReply = async (parentId, content) => {
    await commentsAPI.create(post.id, content, parentId);
    const res = await postsAPI.get(post.id);
    onUpdate(res.data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <GlassCard className="mb-4">
        <div className="flex items-start gap-4">
          <GradientAvatar username={post.author.username} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white">{post.author.username}</span>
              <span className="text-xs text-gray-500">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
          <LikeButton
            liked={post.is_liked}
            count={post.like_count}
            onLike={handleLikePost}
            onUnlike={handleUnlikePost}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:bg-purple-500/10 hover:text-purple-400 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{post.comment_count || 0}</span>
          </motion.button>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <div className="flex gap-2 mb-4">
                <input
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-3 bg-white/5 rounded-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <GlowButton onClick={handleComment} loading={loading}>
                  <Send className="w-5 h-5" />
                </GlowButton>
              </div>

              {post.comments?.map(comment => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onLike={handleCommentLike}
                  onUnlike={handleCommentUnlike}
                  onReply={handleReply}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

// Leaderboard Component
function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardAPI.get()
      .then(res => setLeaders(res.data))
      .catch(err => console.error('Failed to fetch leaderboard', err))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      leaderboardAPI.get().then(res => setLeaders(res.data));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard className="sticky top-28">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-400" />
        <h3 className="font-bold text-white">Top Karma (24h)</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No activity yet</p>
          <p className="text-gray-600 text-xs mt-1">
            +5 karma per post like • +1 per comment like
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              <RankBadge rank={user.rank} />
              <GradientAvatar username={user.username} size="sm" />
              <span className="flex-1 font-medium text-white truncate">{user.username}</span>
              <KarmaPill karma={user.karma_24h} />
            </motion.div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

// Feed Component
function Feed({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const res = await postsAPI.list();
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  return (
    <div className="min-h-screen pt-28 pb-8 relative z-10">
      <Header user={user} onLogout={onLogout} />

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CreatePost onPostCreated={handlePostCreated} />

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : posts.length === 0 ? (
              <GlassCard className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
                <p className="text-gray-500">Be the first to share something!</p>
              </GlassCard>
            ) : (
              <AnimatePresence>
                {posts.map(post => (
                  <Post
                    key={post.id}
                    post={post}
                    onUpdate={handlePostUpdate}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>

          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initCSRF().then(() => {
      authAPI.getCurrentUser()
        .then(res => setUser(res.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    });
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* 3D Background */}
      <Suspense fallback={null}>
        <Background3D />
      </Suspense>

      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-gray-950/50 to-fuchsia-950/30 pointer-events-none z-[1]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none z-[1]" />

      {/* Main content */}
      <AnimatePresence mode="wait">
        {user ? (
          <motion.div
            key="feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Feed user={user} onLogout={handleLogout} />
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AuthForms onLogin={setUser} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
