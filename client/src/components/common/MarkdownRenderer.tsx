import React, { useState } from 'react';
import { Icons } from './Icons';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

      // Match bold: **text**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        tokens.push(
          <strong key={`bold-${keyIdx++}`} style={styles.boldText}>
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
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
      const nextSpecial = remaining.search(/[`*_[\]]/);
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

      // 4. Headings
      if (line.startsWith('#### ')) {
        elements.push(<h5 key={`h4-${blockKey++}`} style={styles.h4}>{renderInline(line.replace('#### ', ''))}</h5>);
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        elements.push(<h4 key={`h3-${blockKey++}`} style={styles.h3}>{renderInline(line.replace('### ', ''))}</h4>);
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        elements.push(<h3 key={`h2-${blockKey++}`} style={styles.h2}>{renderInline(line.replace('## ', ''))}</h3>);
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        elements.push(<h2 key={`h1-${blockKey++}`} style={styles.h1}>{renderInline(line.replace('# ', ''))}</h2>);
        i++;
        continue;
      }

      // 5. Unordered List Items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const listItems: string[] = [];
        while (i < rawLines.length && (rawLines[i]!.trim().startsWith('- ') || rawLines[i]!.trim().startsWith('* '))) {
          listItems.push(rawLines[i]!.trim().replace(/^[-*]\s+/, ''));
          i++;
        }
        elements.push(
          <ul key={`ul-${blockKey++}`} style={styles.ul}>
            {listItems.map((item, lIdx) => (
              <li key={lIdx} style={styles.li}>
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 6. Ordered List Items
      if (/^\d+\.\s+/.test(line.trim())) {
        const listItems: string[] = [];
        while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i]!.trim())) {
          listItems.push(rawLines[i]!.trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        elements.push(
          <ol key={`ol-${blockKey++}`} style={styles.ol}>
            {listItems.map((item, lIdx) => (
              <li key={lIdx} style={styles.li}>
                {renderInline(item)}
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // 7. Empty line spacing
      if (line.trim().length === 0) {
        elements.push(<div key={`sp-${blockKey++}`} style={{ height: '8px' }} />);
        i++;
        continue;
      }

      // 8. Standard Paragraph
      elements.push(
        <p key={`p-${blockKey++}`} style={styles.paragraph}>
          {renderInline(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return <div style={styles.container}>{renderBlocks()}</div>;
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
  }
};
