"""
API Views for the Community Feed.

Key technical implementations:
1. Efficient comment tree loading using MPTT with select_related
2. Atomic transactions with select_for_update for like operations
3. Dynamic 24h leaderboard calculation via aggregation queries
"""
from django.db import IntegrityError, transaction
from django.db.models import Count, F, Value, IntegerField
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model, authenticate, login, logout

from .models import Post, Comment, PostLike, CommentLike
from .serializers import (
    UserSerializer, UserRegistrationSerializer,
    PostSerializer, PostDetailSerializer,
    CommentSerializer, CommentCreateSerializer,
    LeaderboardUserSerializer
)

User = get_user_model()


# ============== Authentication Views ==============

class RegisterView(APIView):
    """User registration endpoint."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request, user)
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """User login endpoint."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response(UserSerializer(user).data)
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(APIView):
    """User logout endpoint."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'})


class CurrentUserView(APIView):
    """Get current authenticated user."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response(UserSerializer(request.user).data)
        return Response({'user': None})


# ============== Post Views ==============

class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Posts with optimized queries.
    
    - List: Prefetches author and like status
    - Detail: Includes full comment tree (efficient via MPTT)
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Post.objects.select_related('author')
        
        # Annotate with comment count
        queryset = queryset.annotate(_comment_count=Count('comments'))
        
        # Add user's like status if authenticated
        if self.request.user.is_authenticated:
            from django.db.models import Exists, OuterRef
            user_likes = PostLike.objects.filter(
                user=self.request.user,
                post=OuterRef('pk')
            )
            queryset = queryset.annotate(_user_has_liked=Exists(user_likes))
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer
        return PostSerializer

    def retrieve(self, request, *args, **kwargs):
        """
        Get post detail with full comment tree.
        
        IMPORTANT: This uses MPTT's efficient tree loading.
        All comments are fetched in ONE query, then built into a tree.
        """
        instance = self.get_object()
        
        # Prefetch ALL comments for this post in a single query
        # select_related for author prevents N+1 on author lookup
        comments = Comment.objects.filter(post=instance).select_related('author')
        
        # Annotate with user's like status
        if request.user.is_authenticated:
            from django.db.models import Exists, OuterRef
            user_likes = CommentLike.objects.filter(
                user=request.user,
                comment=OuterRef('pk')
            )
            comments = comments.annotate(_user_has_liked=Exists(user_likes))
        
        # Attach prefetched comments to the post
        # This prevents additional queries in the serializer
        instance._prefetched_objects_cache = {'comments': list(comments)}
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """
        Like a post with race condition handling.
        
        Uses:
        1. select_for_update() to lock the row
        2. Unique constraint to prevent double-likes
        3. Atomic transaction for data integrity
        """
        with transaction.atomic():
            # Lock the post row to prevent race conditions
            post = Post.objects.select_for_update().get(pk=pk)
            
            try:
                PostLike.objects.create(user=request.user, post=post)
                post.like_count = F('like_count') + 1
                post.save(update_fields=['like_count'])
                post.refresh_from_db()
                return Response({
                    'liked': True,
                    'like_count': post.like_count
                })
            except IntegrityError:
                # User already liked this post
                return Response(
                    {'error': 'You have already liked this post'},
                    status=status.HTTP_400_BAD_REQUEST
                )

    @action(detail=True, methods=['post'])
    def unlike(self, request, pk=None):
        """Unlike a post."""
        with transaction.atomic():
            post = Post.objects.select_for_update().get(pk=pk)
            
            deleted, _ = PostLike.objects.filter(
                user=request.user,
                post=post
            ).delete()
            
            if deleted:
                post.like_count = F('like_count') - 1
                post.save(update_fields=['like_count'])
                post.refresh_from_db()
                return Response({
                    'liked': False,
                    'like_count': post.like_count
                })
            
            return Response(
                {'error': 'You have not liked this post'},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============== Comment Views ==============

class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for Comments."""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Comment.objects.select_related('author')

    def get_serializer_class(self):
        if self.action == 'create':
            return CommentCreateSerializer
        return CommentSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        """Like a comment with race condition handling."""
        with transaction.atomic():
            comment = Comment.objects.select_for_update().get(pk=pk)
            
            try:
                CommentLike.objects.create(user=request.user, comment=comment)
                comment.like_count = F('like_count') + 1
                comment.save(update_fields=['like_count'])
                comment.refresh_from_db()
                return Response({
                    'liked': True,
                    'like_count': comment.like_count
                })
            except IntegrityError:
                return Response(
                    {'error': 'You have already liked this comment'},
                    status=status.HTTP_400_BAD_REQUEST
                )

    @action(detail=True, methods=['post'])
    def unlike(self, request, pk=None):
        """Unlike a comment."""
        with transaction.atomic():
            comment = Comment.objects.select_for_update().get(pk=pk)
            
            deleted, _ = CommentLike.objects.filter(
                user=request.user,
                comment=comment
            ).delete()
            
            if deleted:
                comment.like_count = F('like_count') - 1
                comment.save(update_fields=['like_count'])
                comment.refresh_from_db()
                return Response({
                    'liked': False,
                    'like_count': comment.like_count
                })
            
            return Response(
                {'error': 'You have not liked this comment'},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============== Leaderboard Views ==============

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def leaderboard(request):
    """
    Get top 5 users by Karma earned in the last 24 hours.
    
    Karma calculation:
    - 1 like on a Post = 5 Karma for post author
    - 1 like on a Comment = 1 Karma for comment author
    
    This is calculated DYNAMICALLY from the like tables,
    not stored on the User model.
    """
    cutoff = timezone.now() - timedelta(hours=24)
    
    # Get karma from post likes in last 24h
    # Join: PostLike -> Post -> Author, filter by created_at
    post_karma = (
        PostLike.objects
        .filter(created_at__gte=cutoff)
        .values('post__author')
        .annotate(karma=Count('id') * 5)
        .values_list('post__author', 'karma')
    )
    
    # Get karma from comment likes in last 24h
    # Join: CommentLike -> Comment -> Author, filter by created_at
    comment_karma = (
        CommentLike.objects
        .filter(created_at__gte=cutoff)
        .values('comment__author')
        .annotate(karma=Count('id'))
        .values_list('comment__author', 'karma')
    )
    
    # Combine karma from both sources
    karma_by_user = {}
    for user_id, karma in post_karma:
        karma_by_user[user_id] = karma_by_user.get(user_id, 0) + karma
    
    for user_id, karma in comment_karma:
        karma_by_user[user_id] = karma_by_user.get(user_id, 0) + karma
    
    # Sort by karma and get top 5
    top_users = sorted(
        karma_by_user.items(),
        key=lambda x: x[1],
        reverse=True
    )[:5]
    
    # Fetch user details
    user_ids = [user_id for user_id, _ in top_users]
    users = {u.id: u for u in User.objects.filter(id__in=user_ids)}
    
    # Build response
    result = []
    for rank, (user_id, karma) in enumerate(top_users, start=1):
        user = users.get(user_id)
        if user:
            result.append({
                'id': user.id,
                'username': user.username,
                'avatar_url': user.avatar_url or '',
                'karma_24h': karma,
                'rank': rank
            })
    
    serializer = LeaderboardUserSerializer(result, many=True)
    return Response(serializer.data)
