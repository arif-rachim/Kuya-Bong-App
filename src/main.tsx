import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './theme/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* HashRouter so deep-links work on static hosting & in the Capacitor WebView */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
