import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { flushVisitQueue } from './lib/sync'

export default function App() {
  useEffect(() => {
    const flush = () => flushVisitQueue()
    window.addEventListener('online', flush)
    if (navigator.onLine) flush()
    return () => window.removeEventListener('online', flush)
  }, [])

  return <RouterProvider router={router} />
}
