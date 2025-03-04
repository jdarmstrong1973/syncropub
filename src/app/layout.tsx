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