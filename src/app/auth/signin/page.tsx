// src/app/auth/signin/page.tsx
'use client'

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center w-96">
        <h1 className="text-2xl font-bold mb-4">Welcome to SyncroPub</h1>
        <p className="text-gray-600 mb-6">Please sign in to continue.</p>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-none"
            }
          }}
        />
      </div>
    </div>
  )
}