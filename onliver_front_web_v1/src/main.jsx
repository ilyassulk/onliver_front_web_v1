// Полифилл для global переменной, необходимой для sockjs-client
if (typeof global === 'undefined') {
  window.global = window;
}

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
