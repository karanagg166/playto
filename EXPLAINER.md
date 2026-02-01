# EXPLAINER.md

Technical deep-dive into the Community Feed implementation.

---

## 1. The Tree: Nested Comments

### The Problem
Loading a post with 50 nested comments naively would trigger N+1 queries - one query per comment to fetch its children.

### The Solution: MPTT (Modified Preorder Tree Traversal)

I used `django-mptt` which adds special fields to each comment:

```python
class Comment(MPTTModel):
    post = models.ForeignKey(Post, ...)
    parent = TreeForeignKey('self', null=True, blank=True, ...)
    content = models.TextField()
    
    # MPTT adds these automatically:
    # - lft (left boundary)
    # - rght (right boundary)  
    # - tree_id (which tree this belongs to)
    # - level (depth in tree)
```

**How it works:**

MPTT numbers tree nodes using preorder traversal. For example:
```
Post Comments:
├── Comment A (lft=1, rght=6)
│   ├── Reply A1 (lft=2, rght=3)
│   └── Reply A2 (lft=4, rght=5)
└── Comment B (lft=7, rght=8)
```

With this structure, you can:
- Get all descendants of A with: `WHERE lft > 1 AND rght < 6`
- Know A has children because `rght - lft > 1`

**Efficient Loading (1-2 queries):**

```python
# In views.py - PostViewSet.retrieve()

# ONE query: Get all comments for this post
comments = Comment.objects.filter(post=instance).select_related('author')

# The serializer uses MPTT's structure to build the tree
# without additional queries
```

**Serialization without N+1:**

```python
class CommentSerializer(serializers.ModelSerializer):
    children = RecursiveCommentSerializer(many=True, source='get_children')
    
    # get_children() uses the prefetched MPTT data
    # No additional queries needed!
```

---

## 2. The Math: 24-Hour Leaderboard Query

### The Problem
Calculate karma from the last 24 hours only, without storing a "daily_karma" field on User.

### The Solution: Dynamic Aggregation

From `views.py`:

```python
@api_view(['GET'])
def leaderboard(request):
    cutoff = timezone.now() - timedelta(hours=24)
    
    # Get karma from post likes in last 24h
    # Each post like = 5 karma for the POST AUTHOR
    post_karma = (
        PostLike.objects
        .filter(created_at__gte=cutoff)
        .values('post__author')
        .annotate(karma=Count('id') * 5)
        .values_list('post__author', 'karma')
    )
    
    # Get karma from comment likes in last 24h  
    # Each comment like = 1 karma for the COMMENT AUTHOR
    comment_karma = (
        CommentLike.objects
        .filter(created_at__gte=cutoff)
        .values('comment__author')
        .annotate(karma=Count('id'))
        .values_list('comment__author', 'karma')
    )
    
    # Combine and sort
    karma_by_user = {}
    for user_id, karma in post_karma:
        karma_by_user[user_id] = karma_by_user.get(user_id, 0) + karma
    for user_id, karma in comment_karma:
        karma_by_user[user_id] = karma_by_user.get(user_id, 0) + karma
    
    # Get top 5
    top_users = sorted(karma_by_user.items(), key=lambda x: x[1], reverse=True)[:5]
```

**Equivalent SQL:**

```sql
-- Post karma (5 points per like)
SELECT post.author_id, COUNT(*) * 5 as karma
FROM api_postlike
JOIN api_post ON api_postlike.post_id = api_post.id
WHERE api_postlike.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY post.author_id

UNION ALL

-- Comment karma (1 point per like)
SELECT comment.author_id, COUNT(*) as karma
FROM api_commentlike
JOIN api_comment ON api_commentlike.comment_id = api_comment.id  
WHERE api_commentlike.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY comment.author_id
```

**Database Indexes for Performance:**

```python
class PostLike(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=['created_at']),  # For 24h filter
            models.Index(fields=['post', 'created_at']),
        ]
```

---

## 3. The AI Audit

### Example 1: AI Generated Buggy N+1 Code

**The AI's initial serializer:**

```python
class CommentSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    
    def get_children(self, obj):
        # BUG: This queries the database for EACH comment!
        children = Comment.objects.filter(parent=obj)
        return CommentSerializer(children, many=True).data
```

**The Problem:**
This triggers N+1 queries. For 50 comments, it would run 50 separate queries.

**My Fix:**
Use MPTT's `get_children()` which works with prefetched data:

```python
class CommentSerializer(serializers.ModelSerializer):
    # Use MPTT's built-in method that uses prefetched tree data
    children = RecursiveCommentSerializer(many=True, source='get_children')
```

And in the view, prefetch all comments upfront:
```python
comments = Comment.objects.filter(post=instance).select_related('author')
instance._prefetched_objects_cache = {'comments': list(comments)}
```

---

### Example 2: AI's Incorrect Race Condition Handling

**The AI's initial like endpoint:**

```python
def like(self, request, pk=None):
    post = Post.objects.get(pk=pk)
    
    # Check if already liked
    if PostLike.objects.filter(user=request.user, post=post).exists():
        return Response({'error': 'Already liked'}, status=400)
    
    # Create like
    PostLike.objects.create(user=request.user, post=post)
    post.like_count += 1
    post.save()
```

**The Problem:**
Race condition! Two simultaneous requests could both pass the `.exists()` check, then both create likes. The like_count would also be wrong due to concurrent increments.

**My Fix:**

```python
def like(self, request, pk=None):
    with transaction.atomic():
        # Lock the row to prevent concurrent modifications
        post = Post.objects.select_for_update().get(pk=pk)
        
        try:
            # Let the database enforce uniqueness
            PostLike.objects.create(user=request.user, post=post)
            
            # Use F() for atomic increment
            post.like_count = F('like_count') + 1
            post.save(update_fields=['like_count'])
            
        except IntegrityError:
            # Unique constraint caught the duplicate
            return Response({'error': 'Already liked'}, status=400)
```

Key improvements:
1. `select_for_update()` - Locks the row during the transaction
2. `unique_together` constraint - Database-level duplicate prevention
3. `F('like_count') + 1` - Atomic increment that handles concurrency

---

## Summary

| Challenge | Solution |
|-----------|----------|
| N+1 on nested comments | MPTT with prefetch + `select_related` |
| Dynamic 24h leaderboard | Aggregate queries on Like tables with `created_at` filter |
| Double-like prevention | Database unique constraint + `select_for_update()` |
| Race conditions on like count | Atomic transactions + `F()` expressions |
