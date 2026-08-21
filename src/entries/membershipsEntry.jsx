import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Memberships from '../components/Memberships.jsx'
import '../styles/memberships.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Memberships />
  </StrictMode>,
)
