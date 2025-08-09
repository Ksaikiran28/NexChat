import React from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'

const HomePage = () => {
  return (
    <div className='border w-full  min-h-[80vh]'>
        <div>
          <Sidebar/>
          <ChatContainer />
          <RightSidebar />
        </div>
    </div>
  )
}

export default HomePage