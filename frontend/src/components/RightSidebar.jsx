import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext.jsx'
import { AuthContext } from '../../context/AuthContext.jsx'

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext)
  const { logout, onlineUsers } = useContext(AuthContext)
  const [msgImages, setMsgImages] = useState([])

  // Extract all images from chat messages
  useEffect(() => {
    setMsgImages(messages.filter((msg) => msg.image).map((msg) => msg.image))
  }, [messages])

  return (
    selectedUser && (
      <div
        className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll p-5
        ${selectedUser ? 'max-md:hidden' : ''}`}
      >
        {/* User Info */}
        <div className='pt-10 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt='profile'
            className='w-20 h-20 rounded-full object-cover'
          />
          <h1 className='flex items-center gap-2 text-lg font-medium mt-2'>
            {onlineUsers.includes(selectedUser._id) && (
              <span className='w-3 h-3 rounded-full bg-green-500'></span>
            )}
            {selectedUser.fullName}
          </h1>
          <p className='px-10 mx-auto text-neutral-300 text-sm text-center'>
            {selectedUser.bio || 'No bio available'}
          </p>
        </div>

        <hr className='border-[#ffffff50] my-4' />

        {/* Media Section */}
        <div className='px-5 text-sm'>
          <p className='font-semibold text-gray-300'>Media</p>
          <div className='mt-3 max-h-[220px] overflow-y-scroll grid grid-cols-2 gap-3'>
            {msgImages.length > 0 ? (
              msgImages.map((url, index) => (
                <div
                  key={index}
                  onClick={() => window.open(url, '_blank')}
                  className='cursor-pointer'
                >
                  <img
                    src={url}
                    alt='chat-media'
                    className='rounded-lg w-full h-24 object-cover hover:opacity-90 transition'
                  />
                </div>
              ))
            ) : (
              <p className='text-gray-400 text-xs mt-2'>No media shared yet</p>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => logout()}
          className='absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r
          from-purple-400 to-violet-600 text-white border-none text-sm
          font-medium py-2 px-16 rounded-full cursor-pointer shadow-md hover:opacity-90 transition'
        >
          Logout
        </button>
      </div>
    )
  )
}

export default RightSidebar
  