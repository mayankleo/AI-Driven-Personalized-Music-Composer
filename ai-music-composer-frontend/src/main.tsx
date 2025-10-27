import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import MidiPlayer from './MidiPlayer.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    {/* <MidiPlayer /> */}
  </React.StrictMode>,
)
