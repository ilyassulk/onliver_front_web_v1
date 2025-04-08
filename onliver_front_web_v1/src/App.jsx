import { useState } from 'react'
import { Provider } from 'react-redux'
import './App.css'
import VideoRoom from './components/VideoRoom'
import store from './store'

function App() {
  return (
    <Provider store={store}>
      <div className="app-container">
        <VideoRoom />
      </div>
    </Provider>
  )
}

export default App
