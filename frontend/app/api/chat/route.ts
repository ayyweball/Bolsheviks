import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAdvisorChatResponse } from '@/lib/claude';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { message, conversationId, businessId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const userId = user?.id || 'guest_user';

    // Get or create session
    let session;
    if (conversationId) {
      session = await prisma.chatSession.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId,
          businessId
        },
        include: { messages: true }
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: message
      }
    });

    const history = [
      ...session.messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // Call Claude advisor chat service
    const replyText = await getAdvisorChatResponse(history, {
      name: user?.name,
      language: user?.language || 'en',
      district: user?.district || 'Lucknow',
      state: user?.state || 'Uttar Pradesh'
    });

    // Save assistant reply
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: replyText
      }
    });

    return NextResponse.json({
      chatId: session.id,
      message: assistantMessage.content,
      role: 'assistant',
      timestamp: assistantMessage.createdAt
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message || 'Chat error' }, { status: 500 });
  }
}
