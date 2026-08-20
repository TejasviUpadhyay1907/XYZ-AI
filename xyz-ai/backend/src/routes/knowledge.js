/**
 * School Knowledge API Routes (RAG)
 * Browse school documents and ask questions answered from them.
 */

const express = require('express');
const router = express.Router();
const SchoolKnowledgeService = require('../mockServices/schoolKnowledgeService');

// GET /api/knowledge/documents — List all school documents
router.get('/documents', (req, res) => {
  try {
    const docs = SchoolKnowledgeService.getAllDocuments();
    res.json({ documents: docs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /api/knowledge/documents/:id — Get a specific document
router.get('/documents/:id', (req, res) => {
  try {
    const doc = SchoolKnowledgeService.getDocument(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ document: doc });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// POST /api/knowledge/search — Search documents for relevant content
router.post('/search', (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const ragContext = SchoolKnowledgeService.buildRAGContext(query);

    if (!ragContext || ragContext.results.length === 0) {
      return res.json({
        found: false,
        message: 'No relevant information found in school documents for this query.',
        query
      });
    }

    res.json({
      found: true,
      query,
      sources: ragContext.sources,
      results: ragContext.results.map(r => ({
        doc_title: r.doc_title,
        doc_category: r.doc_category,
        content: r.chunk,
        relevance: r.score,
      })),
      rag_context: ragContext.context,
    });
  } catch (error) {
    console.error('Knowledge search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
