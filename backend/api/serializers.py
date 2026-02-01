"""
Serializers for the Community Feed API.

Key features:
1. RecursiveCommentSerializer - Handles nested comment trees without N+1
2. Post serializer includes nested comments efficiently
3. Leaderboard serializer for dynamic karma calculation
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, Comment, PostLike, CommentLike

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for public display."""
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar_url', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration with password handling."""
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        read_only_fields = ['id']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user


class RecursiveCommentSerializer(serializers.Serializer):
    """
    Recursive serializer for nested comments.
    This is used after we've already fetched all comments efficiently.
    """
    def to_representation(self, instance):
        serializer = CommentSerializer(instance, context=self.context)
        return serializer.data


class CommentSerializer(serializers.ModelSerializer):
    """
    Comment serializer with nested children.
    Children are populated from the prefetched MPTT tree.
    """
    author = UserSerializer(read_only=True)
    children = RecursiveCommentSerializer(many=True, read_only=True, source='get_children')
    user_has_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'author', 'content', 'like_count', 
            'created_at', 'updated_at', 'parent', 'level', 'children',
            'user_has_liked'
        ]
        read_only_fields = ['id', 'author', 'like_count', 'created_at', 'updated_at', 'level']

    def get_user_has_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Use prefetched data if available
            if hasattr(obj, '_user_has_liked'):
                return obj._user_has_liked
            return obj.likes.filter(user=request.user).exists()
        return False


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments."""
    class Meta:
        model = Comment
        fields = ['id', 'post', 'parent', 'content']
        read_only_fields = ['id']

    def validate_parent(self, value):
        """Ensure parent comment belongs to the same post."""
        if value:
            post_id = self.initial_data.get('post')
            if value.post_id != int(post_id):
                raise serializers.ValidationError(
                    "Parent comment must belong to the same post."
                )
        return value


class PostSerializer(serializers.ModelSerializer):
    """
    Post serializer with author info and user-specific like status.
    Comments are loaded separately to avoid N+1.
    """
    author = UserSerializer(read_only=True)
    user_has_liked = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'author', 'content', 'like_count', 
            'created_at', 'updated_at', 'user_has_liked', 'comment_count'
        ]
        read_only_fields = ['id', 'author', 'like_count', 'created_at', 'updated_at']

    def get_user_has_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Use prefetched data if available
            if hasattr(obj, '_user_has_liked'):
                return obj._user_has_liked
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_comment_count(self, obj):
        if hasattr(obj, '_comment_count'):
            return obj._comment_count
        return obj.comments.count()


class PostDetailSerializer(PostSerializer):
    """
    Post serializer with full comment tree.
    Comments are fetched efficiently using MPTT.
    """
    comments = serializers.SerializerMethodField()

    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['comments']

    def get_comments(self, obj):
        """
        Get all root-level comments with their full tree.
        MPTT's get_cached_trees() builds the tree from prefetched data.
        """
        # Get root comments only (parent=None)
        # Children are populated via the recursive serializer
        root_comments = [c for c in obj.comments.all() if c.parent_id is None]
        return CommentSerializer(
            root_comments,
            many=True,
            context=self.context
        ).data


class LeaderboardUserSerializer(serializers.Serializer):
    """
    Serializer for leaderboard entries.
    Karma is calculated dynamically, not stored.
    """
    id = serializers.IntegerField()
    username = serializers.CharField()
    avatar_url = serializers.CharField(allow_blank=True)
    karma_24h = serializers.IntegerField()
    rank = serializers.IntegerField()
