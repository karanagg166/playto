from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from mptt.admin import MPTTModelAdmin
from .models import User, Post, Comment, PostLike, CommentLike


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'created_at']
    fieldsets = UserAdmin.fieldsets + (
        ('Profile', {'fields': ('bio', 'avatar_url')}),
    )


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'author', 'content', 'like_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'author__username']


@admin.register(Comment)
class CommentAdmin(MPTTModelAdmin):
    list_display = ['id', 'author', 'post', 'content', 'like_count', 'level', 'created_at']
    list_filter = ['created_at', 'level']
    search_fields = ['content', 'author__username']


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'created_at']
    list_filter = ['created_at']


@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'comment', 'created_at']
    list_filter = ['created_at']
