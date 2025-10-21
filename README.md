<<<<<<< HEAD

=======
# PhimHub - Movie Streaming Platform

A full-stack movie streaming platform built with React, TypeScript, Express.js, and SQL Server.

## 🚀 Features

- **Movie & Series Streaming**: Watch movies and TV series with HLS video streaming
- **User Authentication**: Secure login/register system with JWT tokens
- **Watch History**: Track your viewing progress
- **Favorites & Custom Lists**: Save and organize your favorite content
- **Admin Panel**: Upload and manage movies/series
- **Search & Filter**: Find content by title, genre, actor, director
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** for styling
- **HLS.js** for video streaming

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **SQL Server** database
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for email services

## 📋 Prerequisites

- Node.js (v18 or higher)
- SQL Server
- npm or yarn

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd phimhub
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_NAME=PhimHub
DB_USER=sa
DB_PASS=YourStrong!Passw0rd
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERT=true

JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

Run database migrations:
```bash
npm run migrate
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📁 Project Structure

```
phimhub/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Express middlewares
│   │   ├── config/          # Configuration files
│   │   └── migrations/      # Database migrations
│   └── uploads/             # File uploads
├── frontend/                # React frontend
│   ├── src/
│   │   ├── features/        # Feature-based modules
│   │   ├── shared/          # Shared components
│   │   ├── services/        # API services
│   │   └── store/           # State management
└── README.md
```

## 🔧 Available Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run migrate:status` - Check migration status

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🗄️ Database Schema

The application uses SQL Server with the following main tables:
- `users` - User accounts and profiles
- `movies` - Movie and series information
- `episodes` - TV series episodes
- `genres` - Movie genres
- `actors` - Actor information
- `directors` - Director information
- `watch_history` - User viewing history
- `favorites` - User favorite content
- `custom_lists` - User-created lists

## 🔐 Authentication

The application uses JWT tokens for authentication. Users can:
- Register with email and password
- Login to get access tokens
- Reset passwords via email
- Update profile information

## 📱 API Endpoints

### Public Endpoints
- `GET /api/movies` - Get all movies with pagination
- `GET /api/movies/:slug` - Get movie details
- `GET /api/movies/search` - Search movies
- `GET /api/genres` - Get all genres

### Protected Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/watch-history` - Get user watch history
- `POST /api/favorites` - Add to favorites

### Admin Endpoints
- `POST /api/admin/movies` - Upload new movie
- `POST /api/admin/series` - Upload new series
- `GET /api/admin/users` - Get all users

## 🚀 Deployment

### Backend Deployment
1. Build the project: `npm run build`
2. Set production environment variables
3. Run migrations: `npm run migrate`
4. Start the server: `npm start`

### Frontend Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions, please create an issue in the repository.
>>>>>>> Feature_BE
