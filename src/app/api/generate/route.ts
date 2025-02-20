import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: Request) {
  // Check authentication using Clerk - with await
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { content, platform } = await request.json()

    let prompt = ""
    if (platform === 'twitter') {
      prompt = `Create a Twitter thread from this article content. Break it into engaging tweets that capture the key points while maintaining a conversational tone. The thread should be engaging and encourage discussion:

${content}

Format the response as a numbered thread, with each tweet separated by numbers and staying within Twitter's character limit for each tweet.`
    } else if (platform === 'linkedin') {
      prompt = `Create a professional LinkedIn post from this article content. The post should be engaging and maintain a professional tone while highlighting key points:

${content}

Format the response as a single cohesive post with appropriate line breaks, emojis, and hashtags where relevant. Focus on business value and professional insights.`
    }

    const completion = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        { role: "user", content: prompt }
      ]
    })
    
    // Safely extract the content
    const responseContent = completion.content.find(
      block => block.type === 'text'
    )?.text ?? ''
    
    return NextResponse.json({ content: responseContent })
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
  }
}