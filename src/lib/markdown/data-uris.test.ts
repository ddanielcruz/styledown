import { toHtml } from 'hast-util-to-html';
import { describe, expect, it } from 'vitest';

import { renderMarkdown } from './render';

const html = (markdown: string) => toHtml(renderMarkdown(markdown));

const URI = `data:image/webp;base64,${'A'.repeat(2000)}`;

describe('data URIs', () => {
  it('keeps a referenced image pointing at its own bytes', () => {
    expect(html(`![A shot][img-1]\n\n[img-1]: ${URI}\n`)).toContain(`src="${URI}"`);
  });

  it('keeps an inline one, the way another editor would have written it', () => {
    expect(html(`![A shot](${URI})\n`)).toContain(`src="${URI}"`);
  });

  it('leaves one written inside a code block as text', () => {
    // Someone documenting the format rather than using it. The bytes are content here,
    // not a destination, and have to come back looking exactly as they were typed.
    expect(html(`\`\`\`\n[img-1]: ${URI}\n\`\`\`\n`)).toContain(URI);
  });

  it('does not touch prose that happens to read like the placeholder', () => {
    const prose = 'The token is styledownimage0, in case you were wondering.';

    expect(html(`${prose}\n\n![A shot][img-1]\n\n[img-1]: ${URI}\n`)).toContain(prose);
  });

  it('carries the same bytes to every image that shares them', () => {
    const twice = html(`![One][img-1]\n\n![Two][img-2]\n\n[img-1]: ${URI}\n\n[img-2]: ${URI}\n`);

    expect(twice.match(new RegExp(`src="${URI}"`, 'g'))).toHaveLength(2);
  });
});
