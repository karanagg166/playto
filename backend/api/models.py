"""
Database models for the Community Feed application.

Key design decisions:
1. Custom User model for extensibility
2. MPTT for nested comments (efficient tree queries in 1-2 SQL queries)
3. Separate Like tables with timestamps for 24h leaderboard calculation
4. Unique constraints to prevent double-likes at DB level
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from mptt.models import MPTTModel, TreeForeignKey


class User(AbstractUser):
    """
    Custom user model. Karma is NOT stored here - it's calculated dynamically
    from PostLike and CommentLike tables for the 24h leaderboard.
    """
    bio = models.TextField(max_length=500, blank=True)
    avatar_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username


class Post(models.Model):
    """
    A feed post with text content.
    like_count is denormalized for display performance but Karma
    is calculated from PostLike table for 24h accuracy.
    """
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(max_length=2000)
    like_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}"


class Comment(MPTTModel):
    """
    Nested comment using MPTT (Modified Preorder Tree Traversal).
    
    MPTT adds these fields automatically:
    - lft, rght: tree node boundaries
    - tree_id: identifies which tree this belongs to
    - level: depth in the tree (0 = root)
    
    This allows fetching entire comment trees in 1-2 queries regardless of depth.
    """
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    parent = TreeForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    content = models.TextField(max_length=1000)
    like_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class MPTTMeta:
        order_insertion_by = ['created_at']

    class Meta:
        ordering = ['tree_id', 'lft']

    def __str__(self):
        return f"{self.author.username}: {self.content[:30]}"


class PostLike(models.Model):
    """
    Like on a Post. Each like = 5 Karma for the post author.
    
    - unique_together prevents double-likes at DB level
    - created_at enables 24h filtering for leaderboard
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'post']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['post', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} likes post {self.post.id}"


class CommentLike(models.Model):
    """
    Like on a Comment. Each like = 1 Karma for the comment author.
    
    - unique_together prevents double-likes at DB level
    - created_at enables 24h filtering for leaderboard
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'comment']
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['comment', 'created_at']),
        ]

    def __str__(self):
        return f"{self.user.username} likes comment {self.comment.id}"
