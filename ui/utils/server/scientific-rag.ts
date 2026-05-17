export type ScientificDocument = {
  pageContent: string;
  metadata: {
    loc?: {
      pageNumber?: number;
    };
    pdf?: {
      info?: {
        Title?: string;
      };
    };
    source?: string;
    [key: string]: unknown;
  };
};

export type ScientificChunkMetadata = {
  title: string;
  page: number | string;
  source: string;
  section: string;
  chunkIndex: number;
  pageChunkIndex: number;
  citationKey: string;
};

const SCIENTIFIC_SECTIONS = [
  'abstract',
  'introduction',
  'background',
  'materials and methods',
  'methodology',
  'methods',
  'experimental setup',
  'experiments',
  'results',
  'evaluation',
  'discussion',
  'limitations',
  'conclusion',
  'references',
];

export const SCIENTIFIC_TEXT_SEPARATORS = [
  '\nAbstract',
  '\nABSTRACT',
  '\nIntroduction',
  '\nINTRODUCTION',
  '\nMethods',
  '\nMETHODS',
  '\nMaterials and Methods',
  '\nMATERIALS AND METHODS',
  '\nExperimental Setup',
  '\nEXPERIMENTAL SETUP',
  '\nExperiments',
  '\nEXPERIMENTS',
  '\nResults',
  '\nRESULTS',
  '\nEvaluation',
  '\nEVALUATION',
  '\nDiscussion',
  '\nDISCUSSION',
  '\nConclusion',
  '\nCONCLUSION',
  '\nReferences',
  '\nREFERENCES',
  '\n\n',
  '\n',
  '. ',
  ' ',
  '',
];

export const normalizeTitle = (
  titleFromMetadata: string | undefined,
  fallbackTitle: string,
) => {
  const title = titleFromMetadata?.trim();

  return title && title.length > 0 ? title : fallbackTitle;
};

export const detectScientificSection = (content: string) => {
  const firstLines = content
    .split('\n')
    .slice(0, 8)
    .join(' ')
    .toLowerCase();

  for (const section of SCIENTIFIC_SECTIONS) {
    const sectionRegex = new RegExp(`\\b${section}\\b`, 'i');

    if (sectionRegex.test(firstLines)) {
      return section;
    }
  }

  return 'body';
};

export const buildCitationKey = ({
  title,
  page,
  pageChunkIndex,
}: {
  title: string;
  page: number | string;
  pageChunkIndex: number;
}) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);

  return `${slug || 'document'}:p${page}:c${pageChunkIndex + 1}`;
};

export const buildScientificMetadata = (
  document: ScientificDocument,
  fallbackTitle: string,
  chunkIndex: number,
  pageChunkIndex = chunkIndex,
): ScientificChunkMetadata => {
  const title = normalizeTitle(document.metadata.pdf?.info?.Title, fallbackTitle);
  const page = document.metadata.loc?.pageNumber ?? 'unknown';
  const section = detectScientificSection(document.pageContent);

  return {
    title,
    page,
    source: document.metadata.source ?? fallbackTitle,
    section,
    chunkIndex,
    pageChunkIndex,
    citationKey: buildCitationKey({ title, page, pageChunkIndex }),
  };
};

export const formatRetrievedDocument = ({
  content,
  metadata,
  distance,
  index,
}: {
  content: string;
  metadata: Partial<ScientificChunkMetadata>;
  distance?: number;
  index: number;
}) => {
  const citationKey = metadata.citationKey ?? `source-${index + 1}`;
  const page = metadata.page ?? 'unknown';
  const section = metadata.section ?? 'body';
  const pageChunkIndex = metadata.pageChunkIndex;
  const scoreLine =
    typeof distance === 'number' ? `Distance: ${distance.toFixed(4)}\n` : '';

  return [
    `Source ${index + 1} [${citationKey}]`,
    `Title: ${metadata.title ?? 'Untitled'}`,
    `Page: ${page}`,
    `Section: ${section}`,
    typeof pageChunkIndex === 'number'
      ? `Page chunk: ${pageChunkIndex + 1}`
      : '',
    scoreLine.trim(),
    `Content: ${content}`,
  ]
    .filter(Boolean)
    .join('\n');
};

export const formatRetrievedDocuments = (data: {
  documents?: unknown;
  metadatas?: unknown;
  distances?: unknown;
}) => {
  const documents = Array.isArray(data.documents)
    ? (data.documents[0] as unknown)
    : undefined;
  const metadatas = Array.isArray(data.metadatas)
    ? (data.metadatas[0] as unknown)
    : undefined;
  const distances = Array.isArray(data.distances)
    ? (data.distances[0] as unknown)
    : undefined;

  if (!Array.isArray(documents) || documents.length === 0) {
    return '';
  }

  return documents
    .map((content, index) => {
      if (typeof content !== 'string' || content.trim().length === 0) {
        return '';
      }

      const metadata =
        Array.isArray(metadatas) && typeof metadatas[index] === 'object'
          ? (metadatas[index] as Partial<ScientificChunkMetadata>)
          : {};
      const distance =
        Array.isArray(distances) && typeof distances[index] === 'number'
          ? distances[index]
          : undefined;

      return formatRetrievedDocument({
        content,
        metadata,
        distance,
        index,
      });
    })
    .filter(Boolean)
    .join('\n\n---\n\n');
};
