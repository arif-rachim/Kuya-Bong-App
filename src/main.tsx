import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './theme/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* HashRouter supaya deep-link berfungsi di static hosting & Capacitor WebView */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
