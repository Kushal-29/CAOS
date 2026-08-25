const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/ai/notices — List analyzed notices
exports.getNoticeAnalyses = async (req, res) => {
  const { clientId, riskLevel } = req.query;

  const where = {
    ...(clientId ? { clientId } : {}),
    ...(riskLevel ? { riskLevel } : {}),
  };

  const notices = await prisma.noticeAnalysis.findMany({
    where,
    include: {
      client: { select: { id: true, name: true, clientCode: true, panNumber: true, gstin: true } },
      document: { select: { id: true, fileName: true, fileUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ notices });
};

// POST /api/ai/notices — Create/Simulate Notice Analysis Entry
exports.createNoticeAnalysis = async (req, res) => {
  const { clientId, documentId, noticeType, taxAuthority, assessmentYear, demandAmount, summary, riskLevel, requiredActions } = req.body;

  const notice = await prisma.noticeAnalysis.create({
    data: {
      clientId,
      documentId,
      noticeType: noticeType || 'Sec 143(1) Intimation',
      taxAuthority: taxAuthority || 'Income Tax Dept',
      assessmentYear: assessmentYear || 'AY 2024-25',
      demandAmount: parseFloat(demandAmount || 0),
      summary: summary || 'AI Notice Analysis summary prepared.',
      riskLevel: riskLevel || 'MEDIUM',
      requiredActions: requiredActions || ['File response on IT portal', 'Verify Form 26AS TDS credits'],
    },
    include: { client: true },
  });

  res.status(201).json({ notice });
};

// POST /api/ai/chat — Future AI Assistant Query Endpoint Stub
exports.chatWithAssistant = async (req, res) => {
  const { conversationId, prompt } = req.body;

  let conversation;
  if (conversationId) {
    conversation = await prisma.aiConversation.findUnique({ where: { id: conversationId } });
  }

  if (!conversation) {
    conversation = await prisma.aiConversation.create({
      data: {
        userId: req.user.id,
        title: prompt.slice(0, 30) + '...',
        module: 'TAX_ASSISTANT',
      },
    });
  }

  // Save User Message
  await prisma.aiMessage.create({
    data: {
      conversationId: conversation.id,
      sender: 'USER',
      content: prompt,
    },
  });

  // Simulated AI response (Ready for Gemini/OpenAI RAG integration)
  const aiResponseContent = `[CAOS AI Foundation] Ready for LLM integration. Analyzed request: "${prompt}". Relevant GST/ITR rules indexed.`;

  const aiMessage = await prisma.aiMessage.create({
    data: {
      conversationId: conversation.id,
      sender: 'AI',
      content: aiResponseContent,
    },
  });

  res.json({
    conversationId: conversation.id,
    response: aiMessage.content,
  });
};
