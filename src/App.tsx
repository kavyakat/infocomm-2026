import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { flushVisitQueue } from './lib/sync'
import { supabase } from './lib/supabase'

export default function App() {
  useEffect(() => {
    // Flush after session is confirmed so auth.uid() is available for RLS
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) flushVisitQueue()
    })
    window.addEventListener('online', flushVisitQueue)
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('online', flushVisitQueue)
    }
  }, [])

  return <RouterProvider router={router} />
}
