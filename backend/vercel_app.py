"""
Vercel serverless entry point for Django.
This file serves as the WSGI handler for Vercel's Python runtime.
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

from django.core.wsgi import get_wsgi_application

app = application = get_wsgi_application()
