import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI, postsAPI, commentsAPI, leaderboardAPI } from './utils/api';
import './index.css';

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// ============== Components ==============

// Avatar Component
function Avatar({ username, size = 'md', className = '' }) {
  const sizeClasses = { sm: 'avatar-sm', md: '', lg: 'avatar-lg' };
  const initial = username ? username[0].toUpperCase() : '?';

  return (
    <div className={`avatar ${sizeClasses[size]} ${className}`}>
      {initial}
    </div>
  );
}

// Loading Spinner
function Spinner() {
  return <div className="spinner mx-auto"></div>;
}

// Auth Forms Component
function AuthForms({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await authAPI.register(username, email, password);
        onLogin(res.data);
      } else {
        const res = await authAPI.login(username, password);
        onLogin(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 w-full max-w-md animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
        {isRegister ? 'Create Account' : 'Welcome Back'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          className="input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {isRegister && (
          <input
            type="email"
            className="input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}

        <input
          type="password"
          className="input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-pink-400 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? <Spinner /> : (isRegister ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      <p className="text-center mt-4 text-gray-400">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-indigo-400 hover:text-indigo-300 font-medium"
        >
          {isRegister ? 'Sign In' : 'Create one'}
        </button>
      </p>
    </div>
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
      const res = await postsAPI.create(content);
      onPostCreated(res.data);
      setContent('');
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 mb-6">
      <textarea
        className="input mb-4"
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !content.trim()}
        >
          {loading ? <Spinner /> : 'Post'}
        </button>
      </div>
    </form>
  );
}

// Like Button Component
function LikeButton({ liked, likeCount, onLike, onUnlike }) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async () => {
    setIsAnimating(true);
    if (liked) {
      await onUnlike();
    } else {
      await onLike();
    }
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={`btn-like ${liked ? 'liked' : ''} ${isAnimating ? 'animate-pulse-once' : ''}`}
    >
      <span className="text-lg">{liked ? '❤️' : '🤍'}</span>
      <span className="font-medium">{likeCount}</span>
    </button>
  );
}

// Comment Component (Recursive for threads)
function Comment({ comment, postId, onCommentAdded }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(comment.user_has_liked);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    try {
      const res = await commentsAPI.like(comment.id);
      setLiked(true);
      setLikeCount(res.data.like_count);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleUnlike = async () => {
    try {
      const res = await commentsAPI.unlike(comment.id);
      setLiked(false);
      setLikeCount(res.data.like_count);
    } catch (err) {
      console.error('Unlike failed:', err);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      await commentsAPI.create(postId, replyContent, comment.id);
      setReplyContent('');
      setShowReply(false);
      onCommentAdded();
    } catch (err) {
      console.error('Reply failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex gap-3 py-3">
        <Avatar username={comment.author?.username} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.author?.username}</span>
            <span className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-2">{comment.content}</p>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <LikeButton
                  liked={liked}
                  likeCount={likeCount}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                />
                <button
                  onClick={() => setShowReply(!showReply)}
                  className="btn-ghost text-xs px-2 py-1"
                >
                  Reply
                </button>
              </>
            )}
          </div>

          {showReply && (
            <form onSubmit={handleReply} className="mt-3 flex gap-2">
              <input
                type="text"
                className="input flex-1 py-2 text-sm"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary py-2 text-sm"
                disabled={submitting}
              >
                Reply
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {comment.children && comment.children.length > 0 && (
        <div className="comment-thread">
          {comment.children.map((child) => (
            <Comment
              key={child.id}
              comment={child}
              postId={postId}
              onCommentAdded={onCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Post Component
function Post({ post: initialPost, onUpdate }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [liked, setLiked] = useState(initialPost.user_has_liked);
  const [likeCount, setLikeCount] = useState(initialPost.like_count);
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const res = await postsAPI.get(post.id);
      setComments(res.data.comments || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleExpand = () => {
    if (!expanded) {
      loadComments();
    }
    setExpanded(!expanded);
  };

  const handleLike = async () => {
    try {
      const res = await postsAPI.like(post.id);
      setLiked(true);
      setLikeCount(res.data.like_count);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleUnlike = async () => {
    try {
      const res = await postsAPI.unlike(post.id);
      setLiked(false);
      setLikeCount(res.data.like_count);
    } catch (err) {
      console.error('Unlike failed:', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await commentsAPI.create(post.id, newComment);
      setNewComment('');
      loadComments();
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <article className="glass-card p-6 mb-4 animate-fade-in">
      {/* Post Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar username={post.author?.username} />
        <div>
          <p className="font-semibold">{post.author?.username}</p>
          <p className="text-xs text-gray-500">
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Post Content */}
      <p className="text-gray-200 mb-4 leading-relaxed">{post.content}</p>

      {/* Post Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-gray-700/30">
        {user && (
          <LikeButton
            liked={liked}
            likeCount={likeCount}
            onLike={handleLike}
            onUnlike={handleUnlike}
          />
        )}
        <button
          onClick={handleExpand}
          className="btn-ghost text-sm"
        >
          💬 {post.comment_count} Comments
        </button>
      </div>

      {/* Comments Section */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-700/30">
          {user && (
            <form onSubmit={handleComment} className="flex gap-2 mb-4">
              <input
                type="text"
                className="input flex-1"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingComment}
              >
                Comment
              </button>
            </form>
          )}

          {loadingComments ? (
            <div className="py-4"><Spinner /></div>
          ) : (
            <div className="space-y-1">
              {comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  onCommentAdded={loadComments}
                />
              ))}
              {comments.length === 0 && (
                <p className="text-gray-500 text-center py-4">No comments yet</p>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// Leaderboard Component
function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await leaderboardAPI.get();
      setLeaders(res.data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
  };

  return (
    <div className="glass-card p-6 sticky top-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        🏆 <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Top Karma (24h)</span>
      </h3>

      {loading ? (
        <div className="py-4"><Spinner /></div>
      ) : leaders.length === 0 ? (
        <p className="text-gray-500 text-center text-sm">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader) => (
            <div
              key={leader.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className={`rank-badge ${getRankClass(leader.rank)}`}>
                {leader.rank}
              </div>
              <Avatar username={leader.username} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{leader.username}</p>
              </div>
              <div className="karma-pill">
                ⚡ {leader.karma_24h}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4 text-center">
        +5 karma per post like • +1 per comment like
      </p>
    </div>
  );
}

// Feed Component
function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const res = await postsAPI.list();
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const { user } = useAuth();

  return (
    <div>
      {user && <CreatePost onPostCreated={handlePostCreated} />}

      {loading ? (
        <div className="py-12"><Spinner /></div>
      ) : posts.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-xl text-gray-400 mb-2">No posts yet</p>
          <p className="text-gray-500">Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post) => (
          <Post key={post.id} post={post} onUpdate={loadPosts} />
        ))
      )}
    </div>
  );
}

// Header Component
function Header({ user, onLogout }) {
  return (
    <header className="glass-card mb-8 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Community Feed
        </h1>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar username={user.username} size="sm" />
              <span className="font-medium">{user.username}</span>
            </div>
            <button onClick={onLogout} className="btn btn-ghost text-sm">
              Sign Out
            </button>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Sign in to interact</span>
        )}
      </div>
    </header>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    authAPI.getCurrentUser()
      .then((res) => {
        if (res.data.id) {
          setUser(res.data);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user }}>
      <div className="min-h-screen p-6">
        <Header user={user} onLogout={handleLogout} />

        <main className="max-w-6xl mx-auto">
          {!user ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <AuthForms onLogin={handleLogin} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Feed />
              </div>
              <div className="lg:col-span-1">
                <Leaderboard />
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
