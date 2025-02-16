'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isForgotPassword) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`
        })
        if (resetError) throw resetError
        setResetEmailSent(true)
      } else if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        if (signUpError) throw signUpError
        alert('Check your email for the confirmation link!')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (signInError) throw signInError
        router.push('/')
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const { data, error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
          // Use localhost for development, production URL for production
          redirectTo: process.env.NODE_ENV === 'development' 
            ? 'http://localhost:3000/auth/callback/google'
            : 'https://syncropub.writerswithoutwalls.com/auth/callback/google'
        }
      })
      if (googleError) throw googleError
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    }
  }
  if (resetEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center w-96">
          <h2 className="text-xl font-semibold mb-4">Check Your Email</h2>
          <p className="text-gray-600 mb-4">
            We've sent password reset instructions to {email}
          </p>
          <button
            onClick={() => {
              setIsForgotPassword(false)
              setResetEmailSent(false)
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center w-96">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Article Publishing System</h1>
        <p className="text-gray-600 mb-6">
          {isForgotPassword 
            ? 'Enter your email to reset password'
            : `Please ${isSignUp ? 'sign up' : 'sign in'} to continue.`}
        </p>
        
        {!isForgotPassword && (
          <>
            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors mb-6"
            >
              Sign in with Google
            </button>

            <div className="relative mb-6">
              <hr className="border-gray-300" />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-gray-500">
                or
              </span>
            </div>
          </>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
          {!isForgotPassword && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          )}
          
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            {loading ? 'Loading...' : (
              isForgotPassword ? 'Send Reset Instructions' :
              isSignUp ? 'Sign Up' : 'Sign In'
            )}
          </button>
        </form>

        {!isForgotPassword && (
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full mt-4 text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        )}

        {!isForgotPassword && !isSignUp && (
          <button
            onClick={() => setIsForgotPassword(true)}
            className="w-full mt-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            Forgot your password?
          </button>
        )}

        {isForgotPassword && (
          <button
            onClick={() => setIsForgotPassword(false)}
            className="w-full mt-4 text-blue-600 hover:text-blue-800 transition-colors"
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  )
}