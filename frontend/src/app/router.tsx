// src/app/router.tsx
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import AccountLayout from "./layouts/AccountLayout";
import AdminLayout from "./layouts/AdminLayout";
import { RequireAuth, RequireRole } from "../shared/lib/guards";

// pages
const Home = lazy(() => import("@features/home/pages/Home"));
const MoviesList = lazy(() => import("@features/catalog/pages/MoviesList"));
const SeriesList = lazy(() => import("@features/catalog/pages/SeriesList"));
const MovieDetail = lazy(() => import("@features/catalog/pages/MovieDetail"));
const SeriesDetail = lazy(() => import("@features/catalog/pages/SeriesDetail"));
const GenresPage = lazy(() => import("@features/catalog/pages/GenresPage"));
const GenreDetailPage = lazy(() => import("@features/catalog/pages/GenreDetailPage"));
const TrendingPage = lazy(() => import("@features/catalog/pages/TrendingPage"));
const WatchMovie = lazy(() => import("@features/watch/pages/WatchMovie"));
const WatchSeries = lazy(() => import("@features/watch/pages/WatchSeries"));
const ActorDetail = lazy(() => import("@features/actors/pages/ActorDetail"));
const ActorsList = lazy(() => import("@features/actors/pages/ActorsList"));
const DirectorDetail = lazy(() => import("@features/directors/pages/DirectorDetail"));
const DirectorsList = lazy(() => import("@features/directors/pages/DirectorsList"));
// Removed Login and Register pages - using AuthModal instead
const ResetPassword = lazy(() => import("@features/auth/pages/ResetPassword"));
const AccountProfile = lazy(() => import("@features/account/pages/AccountProfile"));
const MyLists = lazy(() => import("@features/interactions/pages/MyLists"));
const Favorites = lazy(() => import("@features/interactions/pages/Favorites"));
const Lists = lazy(() => import("@features/interactions/pages/Lists"));
const History = lazy(() => import("@features/interactions/pages/History"));
const TestSelection = lazy(() => import("../pages/TestSelection"));

const AdminDashboard = lazy(() => import("@features/admin/pages/Dashboard"));
const GenresManage = lazy(() => import("@features/admin/pages/GenresManage"));
const MoviesManage = lazy(() => import("@features/admin/pages/MoviesManage"));
const SeriesManage = lazy(() => import("@features/admin/pages/SeriesManage"));
const UsersManage = lazy(() => import("@features/admin/pages/UsersManage"));
const CommentsManage = lazy(() => import("@features/admin/pages/CommentsManage"));
const UploadMovie = lazy(() => import("@features/admin/pages/UploadMovie"));
const UploadSeries = lazy(() => import("@features/admin/pages/UploadSeries"));

const NotFound = lazy(() => import("../pages/NotFound"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },

      { path: "movies", element: <MoviesList /> },
      { path: "genres", element: <GenresPage /> },
      { path: "genres/:slug", element: <GenreDetailPage /> },
      { path: "trending", element: <TrendingPage /> },
      { path: "series", element: <SeriesList /> },
      { path: "actors", element: <ActorsList /> },
      { path: "directors", element: <DirectorsList /> },
      { path: "movies/:slug", element: <MovieDetail /> },
      { path: "series/:slug", element: <SeriesDetail /> },
      { path: "actor/:id", element: <ActorDetail /> },
      { path: "director/:id", element: <DirectorDetail /> },
      { path: "watch/movie/:slug", element: <WatchMovie /> },
      { path: "watch/series/:slug", element: <WatchSeries /> },
      { path: "reset-password", element: <ResetPassword /> },

      // Account (require login)
      {
        element: <RequireAuth />,
        children: [
          {
            path: "account",
            element: <AccountLayout />,
            children: [
              { index: true, element: <AccountProfile /> },
              { path: "my-lists", element: <MyLists /> },
              { path: "favorites", element: <Favorites /> },
              { path: "lists", element: <Lists /> },
              { path: "history", element: <History /> },
            ],
          },
        ],
      },

      // Admin (require role=admin)
      {
        element: <RequireRole role="admin" />,
        children: [
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: "genres", element: <GenresManage /> },
              { path: "movies", element: <MoviesManage /> },
              { path: "series", element: <SeriesManage /> },
              { path: "comments", element: <CommentsManage /> },
              { path: "users", element: <UsersManage /> },
              { path: "upload-movie", element: <UploadMovie /> },
              { path: "upload-series", element: <UploadSeries /> },
            ],
          },
        ],
      },

      { path: "test-selection", element: <TestSelection /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
