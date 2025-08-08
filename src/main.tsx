import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Install global API interceptor and auto session manager on boot
import '@/lib/apiInterceptor'
import { AutoSessionManager } from '@/lib/autoSessionManager'

AutoSessionManager.initialize()

createRoot(document.getElementById("root")!).render(<App />);
