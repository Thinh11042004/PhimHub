import { Link, Route, Routes } from 'react-router-dom'

import Home from './pages/Home.jsx'
import Profile from './pages/Profile.jsx'
import Series from './pages/Series.jsx'
import Favorites from './pages/Favorites.jsx'
import Detail from './pages/Detail.jsx'
import List from './pages/List.jsx'
import Watch from './pages/Watch.jsx'
import SeriesDetail from './pages/SeriesDetail.jsx'
import SeriesWatch from './pages/SeriesWatch.jsx'
import Playlist from './pages/Playlist.jsx'
import Register from './pages/Register.jsx'
import UploadMovie from './pages/UploadMovie.jsx'
import UploadSeries from './pages/UploadSeries.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import AdminGenres from './pages/AdminGenres.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/list" element={<List />} />
      <Route path="/series" element={<Series />} />
      <Route path="/series/:id" element={<SeriesDetail />} />
      <Route path="/series/watch/:id" element={<SeriesWatch />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/detail/:id" element={<Detail />} />
      <Route path="/watch/:id" element={<Watch />} />
      <Route path="/playlist" element={<Playlist />} />
      <Route path="/register" element={<Register />} />
      <Route path="/upload/movie" element={<UploadMovie />} />
      <Route path="/upload/series" element={<UploadSeries />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/genres" element={<AdminGenres />} />
    </Routes>
  )
}

export default App
