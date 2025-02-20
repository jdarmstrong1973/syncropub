'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserButton, useUser } from "@clerk/nextjs"

interface Schedule {
  id: string
  platform: string
  publishDate: string
}

interface Article {
  id: string
  title: string
  status: 'published' | 'draft'
  publishDate: string
  schedule: Schedule[]
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  }).replace(/ /g, ' ')
}

export default function Homepage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
  const [subscriptionStatus, setSubscriptionStatus] = useState<'solo' | 'prime'>('solo')
  const [activeTab, setActiveTab] = useState<'add' | 'schedule' | 'social'>('add')
  const [articles, setArticles] = useState<Article[]>([])
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'published' | 'draft'>('draft')
  const [publishDate, setPublishDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [articleContents, setArticleContents] = useState<{[key: string]: string}>({})
  const [generatedContent, setGeneratedContent] = useState<{
    [key: string]: {
      twitter?: string;
      linkedin?: string;
    };
  }>({})

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/auth/signin')
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    if (user) {
      fetchArticles()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const fetchSubscriptionStatus = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/subscription`)
          const data = await response.json()
          setSubscriptionStatus(data.subscriptionStatus)
        } catch (error) {
          console.error('Error fetching subscription status:', error)
          setSubscriptionStatus('solo')
        }
      }
      fetchSubscriptionStatus()
    }
  }, [user])

  // ... rest of your existing component code ...

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Image 
              src="/images/syncropub.jpg"
              alt="SyncroPub"
              width={200}
              height={200}
              className="object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold mb-1">SyncroPub</h1>
              <p className="text-sm text-gray-600">
                {subscriptionStatus === 'prime' ? 'Prime' : 'Solo'} Plan
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {subscriptionStatus !== 'prime' && (
              <button
                onClick={() => {/* Add upgrade logic */}}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Upgrade to Prime
              </button>
            )}
            <Link href="/auth/settings" className="text-purple-600 hover:text-purple-700">
              Profile Settings
            </Link>
            <UserButton />
          </div>
        </div>

        {/* Rest of your existing JSX ... */}
      </div>
    </main>
  )
}