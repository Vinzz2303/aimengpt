import {
  buildCitationKey,
  buildScientificMetadata,
  detectScientificSection,
  formatRetrievedDocument,
} from '@/utils/server/scientific-rag';
import { describe, expect, it } from 'vitest';

describe('scientific-rag helpers', () => {
  it('detects scientific sections from document chunks', () => {
    expect(detectScientificSection('Abstract\nThis paper studies retrieval.')).toBe(
      'abstract',
    );
    expect(detectScientificSection('METHODS\nWe used a benchmark.')).toBe(
      'methods',
    );
  });

  it('builds stable citation keys', () => {
    expect(
      buildCitationKey({
        title: 'Scientific RAG for Papers!',
        page: 4,
        chunkIndex: 2,
      }),
    ).toBe('scientific-rag-for-papers:p4:c3');
  });

  it('builds metadata with title fallback and section', () => {
    const metadata = buildScientificMetadata(
      {
        pageContent: 'Results\nThe model improved citation accuracy.',
        metadata: {
          loc: { pageNumber: 7 },
          pdf: { info: { Title: '' } },
          source: '/tmp/paper.pdf',
        },
      },
      'paper.pdf',
      0,
    );

    expect(metadata).toMatchObject({
      title: 'paper.pdf',
      page: 7,
      section: 'results',
      citationKey: 'paper-pdf:p7:c1',
    });
  });

  it('formats retrieved documents with citation metadata', () => {
    expect(
      formatRetrievedDocument({
        content: 'Citation-aware answer context.',
        metadata: {
          title: 'Paper',
          page: 2,
          section: 'discussion',
          citationKey: 'paper:p2:c1',
        },
        distance: 0.12345,
        index: 0,
      }),
    ).toContain('Source 1 [paper:p2:c1]');
  });
});
