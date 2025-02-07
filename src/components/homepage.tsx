'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

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

interface User {
  email: string;
  subscriptionStatus: 'solo' | 'prime';
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
  const { data: session } = useSession()
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
    if (session) {
      fetchArticles()
    }
  }, [session])
  useEffect(() => {
    if (session) {
      const fetchSubscriptionStatus = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/subscription`)
          const data = await response.json()
          setSubscriptionStatus(data.subscriptionStatus)
        } catch (error) {
          console.error('Error fetching subscription status:', error)
          setSubscriptionStatus('solo') // Default to solo if error
        }
      }
      fetchSubscriptionStatus()
    }
  }, [session])
  const fetchArticles = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles`)
      const data = await response.json()
      if (data.articles) {
        const sortedArticles = data.articles.sort((a: Article, b: Article) => 
          new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
        )
        setArticles(sortedArticles)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
  
    try {
      // If status is draft, set publishDate to current date
      const finalPublishDate = status === 'draft' ? new Date().toISOString().split('T')[0] : publishDate
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          status,
          publishDate: finalPublishDate,
        }),
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API Error:', errorData)
        throw new Error(`Failed to create article: ${errorData.error || 'Unknown error'}`)
      }
  
      setTitle('')
      setPublishDate('')
      setStatus('draft')
      await fetchArticles()
      setActiveTab('schedule')
    } catch (error) {
      console.error('Error saving article:', error)
      alert('Failed to save article')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg">
          Please{' '}
          <Link href="/auth/signin" className="text-purple-600 hover:underline">
            sign in
          </Link>{' '}
          to access SyncroPub.
        </p>
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
      </div>
      {/* Navigation Tabs */}
<nav className="flex justify-between items-center mb-8">
  <div className="flex space-x-4">
    <button
      onClick={() => setActiveTab('add')}
      className={`px-4 py-2 rounded-t-lg ${
        activeTab === 'add'
          ? 'bg-white shadow-md font-semibold'
          : 'bg-gray-100'
      }`}
    >
      Add Article
    </button>
    <button
      onClick={() => setActiveTab('schedule')}
      className={`px-4 py-2 rounded-t-lg ${
        activeTab === 'schedule'
          ? 'bg-white shadow-md font-semibold'
          : 'bg-gray-100'
      }`}
    >
      Publishing Schedule
    </button>
    <button
      onClick={() => setActiveTab('social')}
      className={`px-4 py-2 rounded-t-lg ${
        activeTab === 'social'
          ? 'bg-white shadow-md font-semibold'
          : 'bg-gray-100'
      }`}
    >
      Social Media
    </button>
  </div>
</nav>
      <div className="flex items-center space-x-4">
        {subscriptionStatus !== 'prime' && (
          <button
            onClick={() => {/* we'll add upgrade logic later */}}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Upgrade to Prime
          </button>
        )}
                        <Link href="/auth/settings" className="text-purple-600 hover:text-purple-700">
              Profile Settings
            </Link>
            <button
              onClick={() => signOut()}
              className="text-purple-600 hover:text-purple-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Add Article Tab */}
        {activeTab === 'add' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Article</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2">Article Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter article title"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Article Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                  className="w-full p-2 border rounded"
                >
                  <option value="draft">Draft - Not Yet Published</option>
                  <option value="published">Already Published</option>
                </select>
              </div>

              {status === 'published' && (
                <div>
                  <label className="block text-gray-700 mb-2">Original Publish Date</label>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full p-2 border rounded"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Note:</span> For optimal SEO:
                    <br />
                    • If article was published within the last 5 days: Original publish date will be used
                    <br />
                    • If article was published more than 5 days ago: Today's date will be used as the base date
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-purple-400"
              >
                {isLoading ? 'Adding...' : 'Add Article'}
              </button>
            </form>
          </div>
        )}

        {/* Publishing Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Publishing Schedule</h2>
            {articles.length === 0 ? (
              <p className="text-gray-500">No articles scheduled yet.</p>
            ) : (
              <div className="space-y-6">
                {articles.map((article) => (
                  <div key={article.id} className="border-b pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{article.title}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            if (confirm('Update this article with your current platform settings?')) {
                              try {
                                const response = await fetch('/api/articles', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    action: 'update_platforms',
                                    articleId: article.id
                                  })
                                })
                                if (response.ok) {
                                  fetchArticles()
                                }
                              } catch (error) {
                                console.error('Error updating platforms:', error)
                              }
                            }
                          }}
                          className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Update Platforms
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Delete this article and its entire schedule?')) {
                              try {
                                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    action: 'delete_article',
                                    articleId: article.id
                                  })
                                })
                                if (response.ok) {
                                  fetchArticles()
                                }
                              } catch (error) {
                                console.error('Error deleting article:', error)
                              }
                            }
                          }}
                          className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete Article
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">
                      Status: {article.status}
                      {article.publishDate && ` - Published: ${formatDate(article.publishDate)}`}
                    </p>
                    {article.schedule && article.schedule.length > 0 && (
                      <div className="ml-4">
                        <h4 className="font-medium mb-1">Platform Schedule:</h4>
                        <table className="min-w-full mt-2">
                          <tbody>
                            {article.schedule
                              .sort((a, b) => new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime())
                              .map((item) => (
                                <tr key={item.id}>
                                  <td className="py-1 pr-4 text-gray-600 font-medium" style={{ width: '120px' }}>
                                    {item.platform}:
                                  </td>
                                  <td className="py-1 text-gray-600">
                                    {formatDate(item.publishDate)}
                                  </td>
                                  <td className="py-1 pl-4">
                                    <button
                                      onClick={async () => {
                                        if (confirm(`Mark ${item.platform} as published and remove from schedule?`)) {
                                          try {
                                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/articles`, {
                                              method: 'DELETE',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                articleId: article.id,
                                                scheduleId: item.id
                                              })
                                            })
                                            if (response.ok) {
                                              await fetchArticles()
                                              if (subscriptionStatus === 'solo') {
                                                alert('Upgrade to Prime to automatically generate social media posts for your articles!')
                                              } else {
                                                if (confirm('Would you like to generate social media content now?')) {
                                                  setActiveTab('social')
                                                }
                                              }
                                            }
                                          } catch (error) {
                                            console.error('Error deleting schedule:', error)
                                          }
                                        }
                                      }}
                                      className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                      Mark Published
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Social Media Tab */}
{activeTab === 'social' && (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-semibold mb-4">Social Media Content</h2>
    
    {articles.filter(article => article.status === 'published').length === 0 ? (
      <p className="text-gray-500">No published articles available for social media promotion.</p>
    ) : (
      <div className="space-y-6">
        {articles
          .filter(article => article.status === 'published')
          .map((article) => (
            <div key={article.id} className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{article.title}</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Published: {formatDate(article.publishDate)}
              </p>

              {/* Article Content Input */}
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Article Content</label>
                <textarea
                  className="w-full p-3 border rounded-lg h-40"
                  placeholder="Paste your article content here to generate social media posts..."
                  value={articleContents[article.id] || ''}
                  onChange={(e) => setArticleContents({
                    ...articleContents,
                    [article.id]: e.target.value
                  })}
                  required
                />
              </div>

              <div className="space-y-4">
                {/* Twitter Section */}
                {/* Twitter Section */}
<div className="bg-gray-50 p-4 rounded">
  <div className="flex justify-between items-center mb-2">
    <h4 className="font-medium">Twitter (X) Thread</h4>
    <button 
      className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      disabled={!articleContents[article.id]}
      onClick={async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: articleContents[article.id],
              platform: 'twitter'
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to generate thread')
          }

          const data = await response.json()
          setGeneratedContent(prev => ({
            ...prev,
            [article.id]: {
              ...prev[article.id],
              twitter: data.content
            }
          }))
        } catch (error) {
          console.error('Error:', error)
          alert('Failed to generate thread')
        }
      }}
    >
      Generate Thread
    </button>
  </div>
  <div className="bg-white p-3 rounded border mt-2 whitespace-pre-wrap relative">
    {generatedContent[article.id]?.twitter ? (
      <>
        <div className="mb-2">{generatedContent[article.id].twitter}</div>
        <button 
          className="absolute top-2 right-2 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          onClick={() => {
            const content = generatedContent[article.id]?.twitter
            if (content) {
              navigator.clipboard.writeText(content)
              alert('Thread copied to clipboard!')
            }
          }}
        >
          Copy Thread
        </button>
      </>
    ) : (
      <p className="text-gray-500 text-sm">Generated content will appear here</p>
    )}
  </div>
</div>

{/* LinkedIn Section */}
<div className="bg-gray-50 p-4 rounded">
  <div className="flex justify-between items-center mb-2">
    <h4 className="font-medium">LinkedIn Post</h4>
    <button 
      className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
      disabled={!articleContents[article.id]}
      onClick={async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: articleContents[article.id],
              platform: 'linkedin'
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to generate post')
          }

          const data = await response.json()
          setGeneratedContent(prev => ({
            ...prev,
            [article.id]: {
              ...prev[article.id],
              linkedin: data.content
            }
          }))
        } catch (error) {
          console.error('Error:', error)
          alert('Failed to generate post')
        }
      }}
    >
      Generate Post
    </button>
  </div>
  <div className="bg-white p-3 rounded border mt-2 whitespace-pre-wrap relative">
    {generatedContent[article.id]?.linkedin ? (
      <>
        <div className="mb-2">{generatedContent[article.id].linkedin}</div>
        <button 
          className="absolute top-2 right-2 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
          onClick={() => {
            const content = generatedContent[article.id]?.linkedin
            if (content) {
              navigator.clipboard.writeText(content)
              alert('Post copied to clipboard!')
            }
          }}
        >
          Copy Post
        </button>
      </>
    ) : (
      <p className="text-gray-500 text-sm">Generated content will appear here</p>
    )}
  </div>
</div>
              </div>
            </div>
          ))}
      </div>
    )}
  </div>
  )}
  </main>)}