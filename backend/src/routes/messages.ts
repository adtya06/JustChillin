import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// Get or create a conversation between current user and a target user
router.post('/conversation', async (req, res) => {
  try {
    const { currentUserId, targetUserId } = req.body;
    
    // Find existing conversation
    const existingConv = await prisma.conversation.findFirst({
      where: {
        participantIds: {
          hasEvery: [currentUserId, targetUserId]
        }
      }
    });

    if (existingConv) {
      return res.json(existingConv);
    }

    // Create new conversation
    const newConv = await prisma.conversation.create({
      data: {
        participantIds: [currentUserId, targetUserId]
      }
    });

    res.json(newConv);
  } catch (error) {
    console.error('Conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch messages for a conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save a new message
router.post('/', async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;
    const message = await prisma.message.create({
      data: {
        text,
        senderId,
        conversationId
      }
    });
    
    // Update conversation's updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.json(message);
  } catch (error) {
    console.error('Message create error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
