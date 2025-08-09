import React from 'react'
import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import bgImage from './assets/bg-Image.png'  

const App = () => {
  return (
    <div className="w-full  min-h-screen bg-no-repeat bg-cover bg-center"
    style={{ backgroundImage: `url(${bgImage})` }}>
      <Routes>
        <Route path='/' element={<HomePage/> } />
        <Route path='/login' element={<LoginPage/> } />
        <Route path='/profile' element={<ProfilePage/> } />
      </Routes>
    </div>
  )
}

export default App