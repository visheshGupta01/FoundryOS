import React, { useState } from 'react';
import { Icons } from './Icons';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);

  const handleCopyCode = async (codeText: string, index: number) => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Ignored
    }
  };

  const renderInline = (text: string): React.ReactNode => {
    // Regex matches inline code `code`, bold **bold**, italic *italic*, links [text](url)
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Match inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        tokens.push(
          <code key={`code-${keyIdx++}`} style={styles.inlineCode}>
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Match bold italic: ***text*** or ___text___
      const boldItalicMatch = remaining.match(/^\*\*\*([^*]+)\*\*\*/) || remaining.match(/^___([^_]+)___/);
      if (boldItalicMatch) {
        tokens.push(
          <strong key={`bolditalic-${keyIdx++}`} style={styles.boldText}>
            <em style={styles.italicText}>{boldItalicMatch[1]}</em>
          </strong>
        );
        remaining = remaining.slice(boldItalicMatch[0].length);
        continue;
      }

      // Match bold: **text** or __text__
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/) || remaining.match(/^__([^_]+)__/);
      if (boldMatch) {
        tokens.push(
          <strong key={`bold-${keyIdx++}`} style={styles.boldText}>
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Match strikethrough: ~~text~~
      const strikeMatch = remaining.match(/^~~([^~]+)~~/);
      if (strikeMatch) {
        tokens.push(
          <del key={`del-${keyIdx++}`} style={styles.strikeText}>
            {strikeMatch[1]}
          </del>
        );
        remaining = remaining.slice(strikeMatch[0].length);
        continue;
      }

      // Match italic: *text* or _text_
      const italicMatch = remaining.match(/^\*([^*]+)\*/) || remaining.match(/^_([^_]+)_/);
      if (italicMatch) {
        tokens.push(
          <em key={`italic-${keyIdx++}`} style={styles.italicText}>
            {italicMatch[1]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Match markdown image: ![alt](url)
      const imageMatch = remaining.match(/^!\[([^\]]*)\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s)]+|[^\s)]+)\)/);
      if (imageMatch) {
        const altText = imageMatch[1] || 'Visual';
        const imgUrl = imageMatch[2] || '';
        tokens.push(
          <span
            key={`img-inline-${keyIdx++}`}
            style={styles.inlineImageCard}
            onClick={() => setSelectedImage({ url: imgUrl, alt: altText })}
            title="Click to zoom visual"
          >
            <img src={imgUrl} alt={altText} loading="lazy" style={styles.inlineImg} />
            {altText && <span style={styles.inlineImgCaption}>{altText}</span>}
          </span>
        );
        remaining = remaining.slice(imageMatch[0].length);
        continue;
      }

      // Match markdown link: [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        tokens.push(
          <a
            key={`link-${keyIdx++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            {linkMatch[1]}
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Plain character
      const nextSpecial = remaining.search(/[`*_~[\]!]/);
      if (nextSpecial === -1) {
        tokens.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        tokens.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        tokens.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return tokens;
  };

  // Block parser
  const renderBlocks = () => {
    const rawLines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let blockKey = 0;

    while (i < rawLines.length) {
      const line = rawLines[i] ?? '';
      const trimmed = line.trim();

      // Image Block: ![alt](url)
      const imgBlockMatch = trimmed.match(/^!\[([^\]]*)\]\((.+)\)$/);
      if (imgBlockMatch) {
        const altText = imgBlockMatch[1] || 'Visual Deliverable & Architecture';
        const imgUrl = imgBlockMatch[2] || '';
        elements.push(
          <div key={`img-block-${blockKey++}`} style={styles.imageBlockWrapper}>
            <div
              style={styles.imageCard}
              onClick={() => setSelectedImage({ url: imgUrl, alt: altText })}
              title="Click to view full resolution visual"
            >
              <img
                src={imgUrl}
                alt={altText}
                loading="lazy"
                style={styles.imageBlock}
              />
              <div style={styles.imageHoverOverlay}>
                <Icons.Search size={14} style={{ color: '#ffffff' }} />
                <span>Enlarge Visual Deliverable</span>
              </div>
            </div>
            {altText && <div style={styles.imageCaption}>{altText}</div>}
          </div>
        );
        i++;
        continue;
      }

      // 1. Fenced Code Block
      if (line.trim().startsWith('```')) {
        const lang = line.trim().replace(/^```/, '').trim() || 'code';
        const codeLines: string[] = [];
        i++;
        while (i < rawLines.length && !rawLines[i]!.trim().startsWith('```')) {
          codeLines.push(rawLines[i]!);
          i++;
        }
        i++; // skip closing ```
        const fullCode = codeLines.join('\n');
        const codeIdx = blockKey++;
        const isCopied = copiedIndex === codeIdx;

        elements.push(
          <div key={`codeblock-${codeIdx}`} style={styles.codeBlockWrapper}>
            <div style={styles.codeHeader}>
              <span style={styles.codeLang}>{lang}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(fullCode, codeIdx)}
                style={styles.codeCopyBtn}
                title="Copy code"
              >
                {isCopied ? (
                  <>
                    <Icons.Check size={12} style={{ color: 'var(--apple-success)' }} />
                    <span style={{ color: 'var(--apple-success)' }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <Icons.Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre style={styles.codePre}>
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        continue;
      }

      // 2. Table Block
      if (line.trim().startsWith('|') && line.includes('|')) {
        const tableLines: string[] = [];
        while (i < rawLines.length && rawLines[i]!.trim().startsWith('|')) {
          tableLines.push(rawLines[i]!.trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerCells = tableLines[0]!
            .split('|')
            .filter((_c, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map(c => c.trim());

          // Skip separator line (e.g. |---|---|)
          const bodyLines = tableLines.slice(2);

          elements.push(
            <div key={`table-${blockKey++}`} style={styles.tableScrollWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {headerCells.map((h, cIdx) => (
                      <th key={cIdx} style={styles.th}>
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyLines.map((rowLine, rIdx) => {
                    const cells = rowLine
                      .split('|')
                      .filter((_c, idx, arr) => idx > 0 && idx < arr.length - 1)
                      .map(c => c.trim());
                    return (
                      <tr key={rIdx} style={rIdx % 2 === 1 ? styles.trAlt : {}}>
                        {cells.map((cell, cIdx) => (
                          <td key={cIdx} style={styles.td}>
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 3. Blockquote / Alert
      if (line.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < rawLines.length && rawLines[i]!.startsWith('>')) {
          quoteLines.push(rawLines[i]!.replace(/^>\s?/, ''));
          i++;
        }
        const quoteText = quoteLines.join(' ');
        const isNote = quoteText.startsWith('[!NOTE]') || quoteText.startsWith('[!TIP]');
        const isWarning = quoteText.startsWith('[!WARNING]') || quoteText.startsWith('[!CAUTION]');

        elements.push(
          <div
            key={`quote-${blockKey++}`}
            style={{
              ...styles.blockquote,
              ...(isWarning ? styles.blockquoteWarning : isNote ? styles.blockquoteNote : {})
            }}
          >
            {renderInline(quoteText.replace(/^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s?/, ''))}
          </div>
        );
        continue;
      }

      // 4. Horizontal Rule (---, ***, ___)
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
        elements.push(<hr key={`hr-${blockKey++}`} style={styles.hr} />);
        i++;
        continue;
      }

      // 5. Headings (H1 to H6)
      const headingMatch = line.trim().match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
      if (headingMatch && headingMatch[1] && headingMatch[2]) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const headingStyle = (styles[`h${level}`] || styles.h4) as React.CSSProperties;

        switch (level) {
          case 1:
            elements.push(<h1 key={`h1-${blockKey++}`} style={headingStyle}>{renderInline(headingText)}</h1>);
            break;
          case 2:
            elements.push(<h2 key={`h2-${blockKey++}`} style={headingStyle}>{renderInline(headingText)}</h2>);
            break;
          case 3:
            elements.push(<h3 key={`h3-${blockKey++}`} style={headingStyle}>{renderInline(headingText)}</h3>);
            break;
          case 4:
            elements.push(<h4 key={`h4-${blockKey++}`} style={headingStyle}>{renderInline(headingText)}</h4>);
            break;
          case 5:
            elements.push(<h5 key={`h5-${blockKey++}`} style={headingStyle}>{renderInline(headingText)}</h5>);
            break;
          case 6:
          default:
            elements.push(<h6 key={`h6-${blockKey++}`} style={headingStyle}>{renderInline(headingText)}</h6>);
            break;
        }
        i++;
        continue;
      }

      // 6. Unordered List Items (-, *, +, and Unicode bullets)
      const isUnordered = (str: string) => /^[-*+•\u2022]\s+/.test(str.trim());
      if (isUnordered(line)) {
        const listItems: { text: string; indent: number; isTask: boolean; checked: boolean }[] = [];
        while (i < rawLines.length && isUnordered(rawLines[i]!)) {
          const currentLine = rawLines[i]!;
          const leadingSpaces = currentLine.search(/\S/);
          const indent = leadingSpaces > 0 ? Math.floor(leadingSpaces / 2) : 0;
          let itemText = currentLine.trim().replace(/^[-*+•\u2022]\s+/, '');
          
          let isTask = false;
          let checked = false;
          if (/^\[([ xX])\]\s+/.test(itemText)) {
            isTask = true;
            checked = /^\[[xX]\]/.test(itemText);
            itemText = itemText.replace(/^\[([ xX])\]\s+/, '');
          }

          listItems.push({ text: itemText, indent, isTask, checked });
          i++;
        }
        elements.push(
          <ul key={`ul-${blockKey++}`} style={styles.ul}>
            {listItems.map((item, lIdx) => (
              <li
                key={lIdx}
                style={{
                  ...styles.li,
                  ...(item.indent > 0 ? { marginLeft: `${item.indent * 16}px`, listStyleType: item.indent % 2 === 1 ? 'circle' : 'square' } : {}),
                  ...(item.isTask ? { listStyleType: 'none', marginLeft: item.indent > 0 ? `${item.indent * 16}px` : 0 } : {})
                }}
              >
                {item.isTask && (
                  <input
                    type="checkbox"
                    readOnly
                    checked={item.checked}
                    style={styles.checkbox}
                  />
                )}
                {renderInline(item.text)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 7. Ordered List Items
      const isOrdered = (str: string) => /^\d+\.\s+/.test(str.trim());
      if (isOrdered(line)) {
        const listItems: { text: string; indent: number }[] = [];
        while (i < rawLines.length && isOrdered(rawLines[i]!)) {
          const currentLine = rawLines[i]!;
          const leadingSpaces = currentLine.search(/\S/);
          const indent = leadingSpaces > 0 ? Math.floor(leadingSpaces / 2) : 0;
          listItems.push({
            text: currentLine.trim().replace(/^\d+\.\s+/, ''),
            indent
          });
          i++;
        }
        elements.push(
          <ol key={`ol-${blockKey++}`} style={styles.ol}>
            {listItems.map((item, lIdx) => (
              <li
                key={lIdx}
                style={{
                  ...styles.li,
                  ...(item.indent > 0 ? { marginLeft: `${item.indent * 16}px` } : {})
                }}
              >
                {renderInline(item.text)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // 8. Empty line spacing
      if (line.trim().length === 0) {
        elements.push(<div key={`sp-${blockKey++}`} style={{ height: '8px' }} />);
        i++;
        continue;
      }

      // 9. Standard Paragraph
      elements.push(
        <p key={`p-${blockKey++}`} style={styles.paragraph}>
          {renderInline(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return (
    <div style={styles.container}>
      {renderBlocks()}
      {selectedImage && (
        <div style={styles.lightboxBackdrop} onClick={() => setSelectedImage(null)}>
          <div style={styles.lightboxModal} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              style={styles.lightboxCloseBtn}
              onClick={() => setSelectedImage(null)}
              title="Close modal"
            >
              ✕
            </button>
            <img src={selectedImage.url} alt={selectedImage.alt} style={styles.lightboxImg} />
            {selectedImage.alt && (
              <div style={styles.lightboxCaption}>{selectedImage.alt}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    color: 'var(--text-primary)',
    lineHeight: 1.65,
    fontSize: '0.92rem',
    wordBreak: 'break-word'
  },
  h1: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#ffffff',
    marginTop: '16px',
    marginBottom: '8px',
    borderBottom: '1px solid var(--glass-border-subtle)',
    paddingBottom: '6px'
  },
  h2: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#ffffff',
    marginTop: '14px',
    marginBottom: '8px'
  },
  h3: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--apple-accent-light, #60a5fa)',
    marginTop: '12px',
    marginBottom: '6px'
  },
  h4: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginTop: '10px',
    marginBottom: '4px'
  },
  h5: {
    fontSize: '0.90rem',
    fontWeight: 600,
    color: '#e2e8f0',
    marginTop: '8px',
    marginBottom: '4px'
  },
  h6: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-tertiary, #94a3b8)',
    marginTop: '6px',
    marginBottom: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  hr: {
    border: 'none',
    borderTop: '1px solid var(--glass-border-subtle, rgba(255, 255, 255, 0.1))',
    margin: '14px 0'
  },
  checkbox: {
    marginRight: '6px',
    verticalAlign: 'middle',
    accentColor: 'var(--apple-accent, #3b82f6)'
  },
  strikeText: {
    textDecoration: 'line-through',
    opacity: 0.7
  },
  paragraph: {
    margin: '4px 0',
    color: 'var(--text-secondary)'
  },
  boldText: {
    fontWeight: 600,
    color: '#ffffff'
  },
  italicText: {
    fontStyle: 'italic',
    color: 'var(--text-secondary)'
  },
  link: {
    color: 'var(--apple-accent)',
    textDecoration: 'underline',
    fontWeight: 500
  },
  inlineCode: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'var(--apple-accent-light, #93c5fd)',
    fontFamily: 'var(--font-mono, monospace)',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.85em'
  },
  codeBlockWrapper: {
    margin: '12px 0',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    border: '1px solid var(--glass-border-subtle)',
    background: '#0d1117'
  },
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 12px',
    background: 'rgba(255, 255, 255, 0.04)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  codeLang: {
    fontSize: '0.72rem',
    fontFamily: 'var(--font-mono, monospace)',
    textTransform: 'uppercase',
    color: 'var(--text-tertiary)',
    letterSpacing: '0.5px'
  },
  codeCopyBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.75rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 6px',
    borderRadius: '4px',
    transition: 'background var(--transition-fast)'
  },
  codePre: {
    margin: 0,
    padding: '12px 14px',
    overflowX: 'auto',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.84rem',
    color: '#e6edf3',
    lineHeight: 1.5
  },
  tableScrollWrapper: {
    overflowX: 'auto',
    margin: '12px 0',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border-subtle)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
    textAlign: 'left'
  },
  th: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#ffffff',
    fontWeight: 600,
    padding: '8px 12px',
    borderBottom: '1px solid var(--glass-border-subtle)'
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    color: 'var(--text-secondary)'
  },
  trAlt: {
    background: 'rgba(255, 255, 255, 0.02)'
  },
  blockquote: {
    margin: '10px 0',
    padding: '8px 14px',
    borderLeft: '3px solid var(--apple-accent)',
    background: 'rgba(59, 130, 246, 0.06)',
    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
    color: 'var(--text-secondary)',
    fontSize: '0.9rem'
  },
  blockquoteNote: {
    borderLeftColor: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.08)'
  },
  blockquoteWarning: {
    borderLeftColor: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.08)'
  },
  ul: {
    margin: '6px 0 6px 18px',
    padding: 0,
    listStyleType: 'disc'
  },
  ol: {
    margin: '6px 0 6px 18px',
    padding: 0,
    listStyleType: 'decimal'
  },
  li: {
    margin: '4px 0',
    color: 'var(--text-secondary)',
    lineHeight: 1.55
  },
  imageBlockWrapper: {
    margin: '18px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
  },
  imageCard: {
    position: 'relative',
    maxWidth: '100%',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: '#0d0e12',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, border-color 0.2s ease'
  },
  imageBlock: {
    width: '100%',
    height: 'auto',
    display: 'block'
  },
  imageHoverOverlay: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '20px',
    fontSize: '0.74rem',
    color: '#ffffff',
    fontWeight: 500,
    pointerEvents: 'none'
  },
  imageCaption: {
    marginTop: '8px',
    fontSize: '0.78rem',
    color: 'var(--text-tertiary)',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  inlineImageCard: {
    display: 'inline-block',
    margin: '4px 6px',
    verticalAlign: 'middle',
    cursor: 'pointer'
  },
  inlineImg: {
    maxHeight: '180px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  inlineImgCaption: {
    display: 'block',
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)',
    textAlign: 'center'
  },
  lightboxBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    animation: 'fadeIn 0.2s ease'
  },
  lightboxModal: {
    position: 'relative',
    maxWidth: '92vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: '-38px',
    right: '0',
    background: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background 0.2s ease'
  },
  lightboxImg: {
    maxWidth: '100%',
    maxHeight: '82vh',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
    objectFit: 'contain'
  },
  lightboxCaption: {
    marginTop: '12px',
    fontSize: '0.86rem',
    color: '#e4e4e7',
    fontWeight: 500,
    textAlign: 'center'
  }
};
