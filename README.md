# Community Feed

A full-stack Community Feed prototype with threaded discussions and a dynamic 24-hour leaderboard.

**Stack:** Django REST Framework + React + Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend

# Install dependencies
pip3 install -r requirements.txt

# Run migrations
python3 manage.py migrate

# Create a superuser (optional)
python3 manage.py createsuperuser

# Start the server
python3 manage.py runserver
```

Backend runs at: http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173

## 🐳 Docker Setup (Optional)

```bash
# Build and run all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

Services:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin

## 🚀 Vercel Deployment (Combined)

Deploy both frontend and backend to Vercel as a single project:

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/playto.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Vercel will auto-detect the `vercel.json` configuration

### 3. Add Environment Variables
In Vercel Project Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | Your Django secret key |
| `DEBUG` | `False` |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `CORS_ORIGINS` | `https://your-app.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | `https://your-app.vercel.app` |

### 4. Database Options
- **Vercel Postgres** (recommended)
- **Neon** (free tier available)
- **Supabase** (free tier available)
- **Railway** (free tier available)

### 5. Deploy
Click "Deploy" - Vercel will:
- Build the React frontend
- Set up Django as serverless functions
- Route `/api/*` to Django, everything else to React

## 📚 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/posts/` | GET, POST | List/create posts |
| `/api/posts/:id/` | GET | Post detail with comments |
| `/api/posts/:id/like/` | POST | Like a post |
| `/api/posts/:id/unlike/` | POST | Unlike a post |
| `/api/comments/` | POST | Create comment |
| `/api/comments/:id/like/` | POST | Like a comment |
| `/api/comments/:id/unlike/` | POST | Unlike a comment |
| `/api/leaderboard/` | GET | Top 5 users by 24h karma |
| `/api/auth/register/` | POST | Register user |
| `/api/auth/login/` | POST | Login |
| `/api/auth/logout/` | POST | Logout |
| `/api/auth/me/` | GET | Current user |

## 🎯 Features

- **Feed**: Text posts with author and like count
- **Threaded Comments**: Nested replies (like Reddit)
- **Gamification**: 
  - Post likes = 5 Karma
  - Comment likes = 1 Karma
- **24h Leaderboard**: Top 5 users by recent karma

## 🧪 Running Tests

```bash
cd backend
python3 manage.py test api.tests
```

## 📁 Project Structure

```
playto/
├── backend/
│   ├── api/
│   │   ├── models.py      # User, Post, Comment (MPTT), Likes
│   │   ├── views.py       # API endpoints
│   │   ├── serializers.py # DRF serializers
│   │   └── tests.py       # Test cases
│   ├── core/
│   │   └── settings.py
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React app
│   │   ├── index.css      # Tailwind + custom styles
│   │   └── utils/api.js   # API client
│   └── vite.config.js
├── docker-compose.yml
├── README.md
└── EXPLAINER.md
```

## Environment Variables

Create `.env` in `backend/`:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
```

## License

MIT
