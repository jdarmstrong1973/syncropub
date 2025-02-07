'use client'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const verifySubscription = async () => {
      if (sessionId) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verify-subscription?sessionId=${sessionId}`)

          if (response.ok) {
            // Redirect to settings or show success message
            window.location.href = '/auth/settings'
          }
        } catch (error) {
          console.error('Subscription verification failed')
        }
      }
    }

    verifySubscription()
  }, [sessionId])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Your Upgrade...</h1>
        <p>Please do not close this window</p>
      </div>
    </div>
  )
}