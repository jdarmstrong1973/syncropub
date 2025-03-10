import {
  ClerkProvider,
  SignedIn,
  UserButton
} from '@clerk/nextjs'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      clerkJSUrl="https://cdn.clerk.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
      appearance={{
        elements: {
          userButtonBox: "mx-auto"
        }
      }}
    >
      <html lang="en">
        <body>
          <header className="p-4 flex justify-end">
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}