'use client'

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-md",
            card: "shadow-lg rounded-lg"
          }
        }}
        signUpUrl="/sign-up"
        forceRedirectUrl="/"
      />
    </div>
  )
}