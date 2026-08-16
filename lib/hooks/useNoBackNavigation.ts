import { useEffect } from 'react'

export function useNoBackNavigation() {
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    function handlePopState() {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
}
