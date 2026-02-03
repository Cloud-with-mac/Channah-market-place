'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical global error
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Critical Error</h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            A critical error occurred. Please refresh the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
