'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

// Create a component that uses useSearchParams
function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState('processing')
  const [error, setError] = useState('')
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id')
        if (!sessionId) {
          setStatus('failed')
          return
        }
        
        // Verification logic here
        setStatus('success')
        
        // Redirect after 5 seconds
        setTimeout(() => {
          router.push('/')
        }, 5000)
      } catch (err) {
        setStatus('failed')
      }
    }
    
    verifyPayment()
  }, [searchParams, router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center w-96">
        <h1 className="text-2xl font-semibold mb-4">
          {status === 'processing' && 'Processing your payment...'}
          {status === 'success' && 'Payment Successful!'}
          {status === 'failed' && 'Payment verification failed'}
        </h1>
        
        {status === 'success' && (
          <>
            <p className="text-green-600 mb-4">
              Your subscription has been activated successfully.
            </p>
            <p className="text-gray-600">
              Redirecting you to the dashboard in 5 seconds...
            </p>
          </>
        )}
        
        {status === 'failed' && (
          <p className="text-red-600 mb-4">
            There was an issue processing your payment. Please try again or contact support.
          </p>
        )}
        
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center w-96">
          <h1 className="text-2xl font-semibold mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}