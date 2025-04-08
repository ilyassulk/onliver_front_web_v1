import { Provider } from 'react-redux'
import { 
  createBrowserRouter, 
  RouterProvider, 
  Navigate 
} from 'react-router-dom'
import './App.css'
import JoinRoom from './components/JoinRoom/JoinRoom'
import ActiveRoom from './components/ActiveRoom/ActiveRoom'


// Создаем маршруты приложения
const router = createBrowserRouter([
  {
    path: '/',
    element: <JoinRoom />
  },
  {
    path: '/room/:roomId',
    element: <ActiveRoom />
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
])

function App() {
  return (
      <div className="app-container">
        <RouterProvider router={router} />
      </div>
  )
}

export default App
