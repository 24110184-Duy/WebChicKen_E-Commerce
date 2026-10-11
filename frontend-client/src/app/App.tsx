import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './router'
import { ScrollToTop } from './router/ScrollToTop'
import { ToastProvider } from '../components/feedback/Toast'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </BrowserRouter>
  )
}
