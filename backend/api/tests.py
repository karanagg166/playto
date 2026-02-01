"""
Tests for the leaderboard calculation logic.
"""
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from api.models import Post, Comment, PostLike, CommentLike

User = get_user_model()


class LeaderboardTestCase(TestCase):
    """
    Test the 24-hour karma leaderboard calculation.
    
    Karma rules:
    - 1 like on a Post = 5 Karma for post author
    - 1 like on a Comment = 1 Karma for comment author
    - Only counts likes from the last 24 hours
    """
    
    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(username='user1', password='testpass123')
        self.user2 = User.objects.create_user(username='user2', password='testpass123')
        self.user3 = User.objects.create_user(username='user3', password='testpass123')
        self.liker = User.objects.create_user(username='liker', password='testpass123')
        
        # Create posts by different users
        self.post1 = Post.objects.create(author=self.user1, content='Post by user1')
        self.post2 = Post.objects.create(author=self.user2, content='Post by user2')
        
        # Create comments
        self.comment1 = Comment.objects.create(
            post=self.post1, author=self.user2, content='Comment by user2'
        )
        self.comment2 = Comment.objects.create(
            post=self.post1, author=self.user3, content='Comment by user3'
        )
        
        self.client = APIClient()
    
    def test_post_like_gives_5_karma(self):
        """Test that liking a post gives 5 karma to the author."""
        # Like user1's post
        PostLike.objects.create(user=self.liker, post=self.post1)
        
        response = self.client.get('/api/leaderboard/')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['username'], 'user1')
        self.assertEqual(data[0]['karma_24h'], 5)
        self.assertEqual(data[0]['rank'], 1)
    
    def test_comment_like_gives_1_karma(self):
        """Test that liking a comment gives 1 karma to the author."""
        # Like user2's comment
        CommentLike.objects.create(user=self.liker, comment=self.comment1)
        
        response = self.client.get('/api/leaderboard/')
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['username'], 'user2')
        self.assertEqual(data[0]['karma_24h'], 1)
    
    def test_combined_karma(self):
        """Test that karma from posts and comments is combined correctly."""
        # Give user1: 5 (post like) + 0 = 5 karma
        PostLike.objects.create(user=self.liker, post=self.post1)
        
        # Give user2: 5 (post like) + 1 (comment like) = 6 karma
        PostLike.objects.create(user=self.liker, post=self.post2)
        CommentLike.objects.create(user=self.liker, comment=self.comment1)
        
        response = self.client.get('/api/leaderboard/')
        data = response.json()
        
        # user2 should be first with 6 karma
        self.assertEqual(data[0]['username'], 'user2')
        self.assertEqual(data[0]['karma_24h'], 6)
        self.assertEqual(data[0]['rank'], 1)
        
        # user1 should be second with 5 karma
        self.assertEqual(data[1]['username'], 'user1')
        self.assertEqual(data[1]['karma_24h'], 5)
        self.assertEqual(data[1]['rank'], 2)
    
    def test_only_counts_last_24_hours(self):
        """Test that likes older than 24 hours are not counted."""
        # Create a like NOW - should be counted
        recent_like = PostLike.objects.create(user=self.liker, post=self.post1)
        
        # Create an OLD like (25 hours ago) - should NOT be counted
        old_like = PostLike.objects.create(user=self.user2, post=self.post2)
        # Manually set created_at to 25 hours ago
        PostLike.objects.filter(pk=old_like.pk).update(
            created_at=timezone.now() - timedelta(hours=25)
        )
        
        response = self.client.get('/api/leaderboard/')
        data = response.json()
        
        # Only user1 should appear (from recent_like on their post)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['username'], 'user1')
        self.assertEqual(data[0]['karma_24h'], 5)
    
    def test_leaderboard_returns_top_5_only(self):
        """Test that leaderboard returns at most 5 users."""
        # Create 7 users and give them karma
        users = [User.objects.create_user(username=f'top{i}', password='pass') for i in range(7)]
        
        for i, user in enumerate(users):
            post = Post.objects.create(author=user, content=f'Post {i}')
            # Give each user different amounts of karma
            for _ in range(7 - i):  # First user gets most likes
                liker = User.objects.create_user(
                    username=f'liker_{i}_{_}', password='pass'
                )
                PostLike.objects.create(user=liker, post=post)
        
        response = self.client.get('/api/leaderboard/')
        data = response.json()
        
        # Should only return top 5
        self.assertEqual(len(data), 5)
        
        # Verify ranking order
        for i in range(4):
            self.assertGreaterEqual(data[i]['karma_24h'], data[i+1]['karma_24h'])


class DoubleLikePreventionTestCase(TestCase):
    """Test that users cannot like the same content twice."""
    
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.author = User.objects.create_user(username='author', password='testpass123')
        self.post = Post.objects.create(author=self.author, content='Test post')
        self.comment = Comment.objects.create(
            post=self.post, author=self.author, content='Test comment'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_cannot_double_like_post(self):
        """Test that liking a post twice returns an error."""
        # First like should succeed
        response = self.client.post(f'/api/posts/{self.post.id}/like/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['liked'])
        
        # Second like should fail
        response = self.client.post(f'/api/posts/{self.post.id}/like/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())
    
    def test_cannot_double_like_comment(self):
        """Test that liking a comment twice returns an error."""
        # First like should succeed
        response = self.client.post(f'/api/comments/{self.comment.id}/like/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['liked'])
        
        # Second like should fail
        response = self.client.post(f'/api/comments/{self.comment.id}/like/')
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())
    
    def test_unlike_then_like_again_works(self):
        """Test that you can like -> unlike -> like again."""
        # Like
        self.client.post(f'/api/posts/{self.post.id}/like/')
        
        # Unlike
        response = self.client.post(f'/api/posts/{self.post.id}/unlike/')
        self.assertEqual(response.status_code, 200)
        
        # Like again should work
        response = self.client.post(f'/api/posts/{self.post.id}/like/')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['liked'])
