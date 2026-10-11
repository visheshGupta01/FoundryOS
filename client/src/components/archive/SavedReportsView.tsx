import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ArchivedDocumentItem } from '../../types';

export const SavedReportsView: React.FC = () => {
  const {
    archivedDocuments,
    uploadDocumentToArchive,
    generatePdfInArchive,
    deleteArchivedDocument
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'uploaded' | 'generated' | 'pdf'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<ArchivedDocumentItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const filteredDocs = archivedDocuments.filter(doc => {
    const matchesTab = activeTab === 'all' || doc.category === activeTab;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadContent.trim()) return;
    const fn = uploadFileName.trim() || `${uploadTitle.replace(/\s+/g, '_')}.md`;
    await uploadDocumentToArchive(uploadTitle, fn, uploadContent);
    setUploadTitle('');
    setUploadContent('');
    setUploadFileName('');
    setIsUploadModalOpen(false);
  };

  const handleGeneratePdfForDoc = async (doc: ArchivedDocumentItem) => {
    setIsGeneratingPdf(true);
    try {
      await generatePdfInArchive(doc.title.replace(/\.pdf$/, ''), doc.content, doc.summary);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this document from the archive?')) {
      await deleteArchivedDocument(id);
      if (selectedDoc?.id === id) setSelectedDoc(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Document Archive & PDF Hub</h1>
          <p style={styles.subtitle}>
            Upload strategy documents, review AI-generated reports, and generate executive PDF briefs powered by Gemma 3 & MCP tools.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button onClick={() => setIsUploadModalOpen(true)} style={styles.uploadBtn}>
            + Upload Document
          </button>
        </div>
      </div>

      <div style={styles.filterBar}>
        <div style={styles.tabs}>
          {(['all', 'uploaded', 'generated', 'pdf'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                ...(activeTab === tab ? styles.tabActive : {})
              }}
            >
              {tab === 'all' && `All (${archivedDocuments.length})`}
              {tab === 'uploaded' && `Uploaded (${archivedDocuments.filter(d => d.category === 'uploaded').length})`}
              {tab === 'generated' && `Generated (${archivedDocuments.filter(d => d.category === 'generated').length})`}
              {tab === 'pdf' && `PDF Reports (${archivedDocuments.filter(d => d.category === 'pdf').length})`}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Filter documents..."
          style={styles.filterInput}
        />
      </div>

      {filteredDocs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📁</div>
          <h3 style={styles.emptyTitle}>No Documents Found</h3>
          <p style={styles.emptyText}>
            No archived documents match your selected tab or search query. Upload files or ask your AI agents to generate reports.
          </p>
          <button onClick={() => setIsUploadModalOpen(true)} style={styles.actionBtn}>
            + Upload First Document
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredDocs.map(doc => (
            <div key={doc.id} onClick={() => setSelectedDoc(doc)} style={styles.card}>
              <div style={styles.cardTop}>
                <span
                  style={{
                    ...styles.badge,
                    background:
                      doc.category === 'pdf'
                        ? 'rgba(255, 69, 58, 0.15)'
                        : doc.category === 'uploaded'
                        ? 'rgba(48, 209, 88, 0.15)'
                        : 'rgba(10, 132, 255, 0.15)',
                    color:
                      doc.category === 'pdf'
                        ? '#ff453a'
                        : doc.category === 'uploaded'
                        ? '#30d158'
                        : '#0a84ff'
                  }}
                >
                  {doc.category.toUpperCase()}
                </span>
                <span style={styles.date}>
                  {new Date(doc.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>

              <h3 style={styles.cardTitle}>{doc.title}</h3>
              <p style={styles.cardSummary}>{doc.summary.slice(0, 140)}...</p>

              <div style={styles.cardFooter}>
                <a
                  href={`/api/documents/${doc.id}/download`}
                  download={doc.fileName}
                  onClick={e => e.stopPropagation()}
                  style={styles.downloadLink}
                >
                  📥 Download {doc.category === 'pdf' ? 'PDF' : 'File'}
                </a>

                {doc.category !== 'pdf' && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleGeneratePdfForDoc(doc);
                    }}
                    disabled={isGeneratingPdf}
                    style={styles.pdfConvertBtn}
                  >
                    📄 Convert to PDF
                  </button>
                )}

                <button onClick={e => handleDelete(doc.id, e)} style={styles.deleteBtn}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Detail Preview Modal */}
      {selectedDoc && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedDoc(null)}>
          <div style={styles.previewModal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.badge}>{selectedDoc.category.toUpperCase()}</span>
                <h2 style={styles.modalTitle}>{selectedDoc.title}</h2>
                <p style={styles.modalMeta}>
                  File: {selectedDoc.fileName} | Created: {new Date(selectedDoc.createdAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setSelectedDoc(null)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {selectedDoc.category === 'pdf' ? (
                <div style={styles.pdfPlaceholder}>
                  <p>📄 This is a generated PDF document ({selectedDoc.fileName}).</p>
                  <a href={`/api/documents/${selectedDoc.id}/download`} style={styles.downloadBigBtn}>
                    Download PDF Document ({Math.round((Number(selectedDoc.metadata.fileSize) || 0) / 1024)} KB)
                  </a>
                </div>
              ) : (
                <pre style={styles.textContent}>{selectedDoc.content}</pre>
              )}
            </div>

            <div style={styles.modalFooter}>
              <a href={`/api/documents/${selectedDoc.id}/download`} style={styles.downloadBigBtn}>
                Download Deliverable
              </a>
              {selectedDoc.category !== 'pdf' && (
                <button
                  onClick={() => handleGeneratePdfForDoc(selectedDoc)}
                  disabled={isGeneratingPdf}
                  style={styles.pdfConvertBtn}
                >
                  Export as Formatted PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div style={styles.modalBackdrop} onClick={() => setIsUploadModalOpen(false)}>
          <form style={styles.uploadModal} onSubmit={handleFileUpload} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Upload Document to Archive</h2>
              <button type="button" onClick={() => setIsUploadModalOpen(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Document Title</label>
              <input
                type="text"
                required
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder="e.g. Q4 Growth & Content Strategy"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>File Name (Optional)</label>
              <input
                type="text"
                value={uploadFileName}
                onChange={e => setUploadFileName(e.target.value)}
                placeholder="e.g. Q4_Growth_Strategy.md"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Document Content (Text or Markdown)</label>
              <textarea
                required
                rows={8}
                value={uploadContent}
                onChange={e => setUploadContent(e.target.value)}
                placeholder="Paste document text or markdown strategy here..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.modalFooter}>
              <button type="button" onClick={() => setIsUploadModalOpen(false)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" style={styles.submitBtn}>
                Save to Archive
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '30px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    overflowY: 'auto',
    height: 'calc(100vh - 60px)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    gap: '20px'
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    color: 'var(--text-primary)',
    marginBottom: '8px'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.94rem',
    lineHeight: '1.5',
    maxWidth: '700px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  uploadBtn: {
    padding: '7px 14px',
    background: '#ffffff',
    color: '#09090b',
    border: '1px solid #ffffff',
    borderRadius: 'var(--radius-xs)',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)'
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: '16px',
    flexWrap: 'wrap'
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    background: 'transparent',
    padding: '0'
  },
  tab: {
    padding: '5px 12px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-xs)',
    color: 'var(--text-tertiary)',
    fontSize: '0.8rem',
    fontWeight: 400,
    cursor: 'pointer',
    transition: 'color var(--transition-fast)'
  },
  tabActive: {
    background: 'transparent',
    color: 'var(--text-primary)',
    fontWeight: 600
  },
  filterInput: {
    background: 'var(--glass-bg-input)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xs)',
    padding: '6px 12px',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    outline: 'none',
    minWidth: '220px'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-xl)'
  },
  emptyIcon: {
    fontSize: '2.8rem',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '8px'
  },
  emptyText: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    maxWidth: '460px',
    marginBottom: '24px'
  },
  actionBtn: {
    padding: '10px 22px',
    background: '#ffffff',
    color: '#000000',
    border: 'none',
    borderRadius: 'var(--radius-pill)',
    fontWeight: 600,
    cursor: 'pointer'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  card: {
    background: 'var(--glass-bg-card)',
    border: '1px solid var(--glass-border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s ease'
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  badge: {
    fontSize: '0.68rem',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: 'var(--radius-pill)'
  },
  date: {
    fontSize: '0.72rem',
    color: 'var(--text-tertiary)'
  },
  cardTitle: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '8px'
  },
  cardSummary: {
    fontSize: '0.84rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    flex: 1,
    marginBottom: '16px'
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '12px',
    borderTop: '1px solid var(--glass-border-subtle)',
    gap: '8px'
  },
  downloadLink: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#0a84ff',
    textDecoration: 'none'
  },
  pdfConvertBtn: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '4px 8px',
    fontSize: '0.74rem',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  deleteBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    opacity: 0.7
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  previewModal: {
    background: '#1c1c1e',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
    maxWidth: '750px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  uploadModal: {
    background: '#1c1c1e',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
    maxWidth: '560px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff'
  },
  modalMeta: {
    fontSize: '0.78rem',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: '4px'
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.2rem',
    cursor: 'pointer'
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1
  },
  textContent: {
    whiteSpace: 'pre-wrap',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.86rem',
    lineHeight: '1.6',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  pdfPlaceholder: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  downloadBigBtn: {
    padding: '10px 20px',
    background: '#0a84ff',
    color: '#ffffff',
    borderRadius: 'var(--radius-pill)',
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: '0.86rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.8)'
  },
  input: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    color: '#ffffff',
    fontSize: '0.88rem',
    outline: 'none'
  },
  textarea: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 14px',
    color: '#ffffff',
    fontSize: '0.88rem',
    outline: 'none',
    resize: 'vertical'
  },
  cancelBtn: {
    padding: '10px 18px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    borderRadius: 'var(--radius-pill)',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '10px 22px',
    background: '#30d158',
    border: 'none',
    color: '#000000',
    fontWeight: 700,
    borderRadius: 'var(--radius-pill)',
    cursor: 'pointer'
  }
};
