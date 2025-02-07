'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SettingsPage() {
  const [platforms] = useState<string[]>([
    'Medium',
    'LinkedIn',
    'Substack',
    'Zirkels',
    'Bulb',
    'Paragraph',
    'BeyondSocial'
  ])

  const [socialPlatforms] = useState<string[]>([
    'Twitter (X)',
    'LinkedIn'
  ])

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedSocialPlatforms, setSelectedSocialPlatforms] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'solo' | 'prime'>('solo')
  const [emailNotifications, setEmailNotifications] = useState<boolean>(false)
  const [notificationEmail, setNotificationEmail] = useState<string>('')

  // Load saved settings when page loads
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`)
        const data = await response.json()
                
        if (data.platforms) {
          setSelectedPlatforms(data.platforms)
        }
        if (data.socialMedia) {
          setSelectedSocialPlatforms(data.socialMedia)
        }
        if (data.emailNotifications !== undefined) {
          setEmailNotifications(data.emailNotifications)
        }
        if (data.notificationEmail) {
          setNotificationEmail(data.notificationEmail)
        }
        if (data.subscriptionStatus) {
          setSubscriptionStatus(data.subscriptionStatus)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handlePlatformChange = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      // Always allow deselecting
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
    } else {
      // For Solo users, limit to 2 platforms
      if (subscriptionStatus === 'solo' && selectedPlatforms.length >= 2) {
        alert('Solo plan is limited to 2 platforms. Upgrade to Prime for unlimited platforms!')
        return
      }
      setSelectedPlatforms([...selectedPlatforms, platform])
    }
  }

  const handleSocialPlatformChange = (platform: string) => {
    if (selectedSocialPlatforms.includes(platform)) {
      setSelectedSocialPlatforms(selectedSocialPlatforms.filter(p => p !== platform))
    } else {
      setSelectedSocialPlatforms([...selectedSocialPlatforms, platform])
    }
  }

  const handleUpgradeToPrime = async (subscriptionType: 'monthly' | 'annual') => {
    try {
      setIsUpgrading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscriptionType })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to upgrade. Please try again.')
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platforms: selectedPlatforms,
          socialMedia: selectedSocialPlatforms,
          emailNotifications,
          notificationEmail 
        })
      })
      
      if (response.ok) {
        alert('Settings saved successfully!')
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  // If loading, show loading message
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Navigation */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <Link
          href="/"
          className="text-purple-600 hover:text-purple-700"
        >
          Home
        </Link>
      </div>

      {/* Publishing Platforms Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Publishing Platforms</h2>
        <p className="text-gray-600 mb-4">
          Select the platforms where you publish your articles. These will be used to schedule your posts.
        </p>

        <div className="space-y-2">
          {platforms.map((platform) => (
            <label key={platform} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(platform)}
                onChange={() => handlePlatformChange(platform)}
                className="form-checkbox h-5 w-5 text-purple-600"
              />
              <span>{platform}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 relative mb-6">
        {subscriptionStatus === 'solo' && (
          <div className="absolute inset-0 bg-gray-50/90 flex items-center justify-center z-10">
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold mb-2">Prime Feature</h3>
              <p className="text-gray-600 mb-4">
                Upgrade to Prime to unlock social media content generation
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleUpgradeToPrime('monthly')}
                  disabled={isUpgrading}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isUpgrading ? 'Processing...' : 'Monthly ($14.95/mo)'}
                </button>
                <button
                  onClick={() => handleUpgradeToPrime('annual')}
                  disabled={isUpgrading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isUpgrading ? 'Processing...' : 'Annual ($149.50/yr)'}
                </button>
              </div>
            </div>
          </div>
        )}
        <h2 className="text-xl font-semibold mb-4">Social Media Platforms</h2>
        <p className="text-gray-600 mb-4">
          Select the social media platforms where you want to promote your articles.
        </p>

        <div className="space-y-2">
          {socialPlatforms.map((platform) => {
            const isSelected = selectedSocialPlatforms.includes(platform)
            const atLimit = subscriptionStatus === 'solo' && 
                           selectedSocialPlatforms.length >= 2 && 
                           !isSelected

            return (
              <label 
                key={platform} 
                className={`flex items-center space-x-2 ${
                  atLimit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSocialPlatformChange(platform)}
                  disabled={atLimit}
                  className="form-checkbox h-5 w-5 text-purple-600 disabled:text-gray-300"
                />
                <span className={atLimit ? 'text-gray-400' : 'text-gray-700'}>
                  {platform}
                </span>
                {atLimit && (
                  <span className="text-sm text-purple-600 ml-2">
                    (Prime feature)
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </div>

      {/* Email Notification Settings */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Daily Schedule Notifications</h2>
        <p className="text-gray-600 mb-4">
          Receive daily email updates about your publishing schedule.
        </p>

        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="form-checkbox h-5 w-5 text-purple-600"
            />
            <span>Enable daily schedule emails</span>
          </label>

          {emailNotifications && (
            <div>
              <label className="block text-gray-700 mb-2">Notification Email</label>
              <input
                type="email"
                value={notificationEmail || ''}
                onChange={(e) => setNotificationEmail(e.target.value)}
                placeholder="Enter email address for notifications"
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave blank to use your account email
              </p>
              <div className="mt-4">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/test-email`)
                      if (response.ok) {
                        alert('Test email sent! Check your inbox.')
                      } else {
                        throw new Error('Failed to send test email')
                      }
                    } catch (error) {
                      console.error('Error:', error)
                      alert('Failed to send test email')
                    }
                  }}
                  className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Send Test Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-6 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed w-full"
      >
        {isSaving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}