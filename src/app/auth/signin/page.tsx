// app/auth/signin/page.tsx
'use client' // Mark this as a client component
import { signIn } from 'next-auth/react'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Article Publishing System</h1>
        <p className="text-gray-600 mb-6">Please sign in to continue.</p>
        <button
          onClick={() => signIn('google')} // Trigger Google sign-in
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}