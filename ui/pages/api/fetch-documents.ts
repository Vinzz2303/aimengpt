import type { NextApiRequest, NextApiResponse } from 'next';
import { ChromaClient, TransformersEmbeddingFunction } from 'chromadb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).end();
    }

    const client = new ChromaClient({
      path: process.env.CHROMA_PATH || 'http://chroma-server:8000',
    });

    const query = typeof req.body.input === 'string' ? req.body.input.trim() : '';
    const requestedResults = Number(req.body.nResults ?? 6);
    const nResults = Number.isFinite(requestedResults)
      ? Math.min(Math.max(Math.trunc(requestedResults), 1), 10)
      : 6;

    if (!query) {
      return res.status(400).json({ error: 'Missing retrieval query' });
    }

    const embedder = new TransformersEmbeddingFunction();

    const collection = await client.getOrCreateCollection({
      name: 'default-collection',
      embeddingFunction: embedder,
    });

    // query the collection
    const results = await collection.query({
      nResults,
      queryTexts: [query],
      include: ['documents', 'metadatas', 'distances'] as any,
    });

    res.status(200).json(results);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
    res.status(500).json({ error: 'An unexpected error occurred :(' });
  }
}
