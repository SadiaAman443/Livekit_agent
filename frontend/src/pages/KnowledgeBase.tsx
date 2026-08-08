import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, Globe, HelpCircle, StickyNote, Database, 
  Search, Plus, X, Trash2, Edit2, RefreshCw, Eye,
  Loader2, Clock, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { cn } from '@/lib/utils';

interface DocumentInfo {
  id: number;
  document: string;
  source_type: string;
  source_url: string | null;
  chunks: number;
  embedding_status: string;
  uploaded_at: string;
}

export const KnowledgeBase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'pdf' | 'url' | 'faq' | 'note'>('all');
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [stats, setStats] = useState({
    total_documents: 0,
    total_urls: 0,
    total_faqs: 0,
    total_notes: 0,
    total_chunks: 0,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [activeModal, setActiveModal] = useState<'document' | 'website' | 'faq' | 'note' | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [urlInput, setUrlInput] = useState('');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/api/knowledge/stats');
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const typeParam = activeTab === 'all' ? '' : activeTab;
      const queryParam = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : '';
      const res = await apiClient.get(`/api/knowledge/documents?source_type=${typeParam}${queryParam}`);
      
      if (activeTab === 'pdf') {
        const allRes = await apiClient.get(`/api/knowledge/documents?query=${searchQuery ? encodeURIComponent(searchQuery) : ''}`);
        setDocuments(allRes.data.filter((d: DocumentInfo) => ['pdf', 'docx', 'txt'].includes(d.source_type)));
      } else {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDocuments();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, fetchDocuments, activeTab]);

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete this document?`)) return;
    try {
      await apiClient.delete(`/api/knowledge/document/${id}`);
      fetchDocuments();
      fetchStats();
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  const handleReindex = async (id: number) => {
    try {
      await apiClient.post(`/api/knowledge/reindex/${id}`);
      fetchDocuments();
      fetchStats();
    } catch (err) {
      alert('Failed to reindex document.');
    }
  };

  const openEditModal = (doc: DocumentInfo) => {
    setEditingDoc(doc);
    if (doc.source_type === 'faq') {
      setFaqQuestion(doc.document);
      setFaqAnswer('');
      setActiveModal('faq');
    } else if (doc.source_type === 'note') {
      setNoteTitle(doc.document);
      setNoteContent('');
      setActiveModal('note');
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingDoc(null);
    setError(null);
    setUrlInput('');
    setFaqQuestion('');
    setFaqAnswer('');
    setNoteTitle('');
    setNoteContent('');
  };

  // Upload Logic
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.post('/api/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchDocuments();
      fetchStats();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const submitUrl = async () => {
    if (!urlInput) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/api/knowledge/url', { url: urlInput });
      fetchDocuments();
      fetchStats();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add URL.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFaq = async () => {
    if (!faqQuestion || !faqAnswer) return;
    setIsSubmitting(true);
    try {
      if (editingDoc) {
        await apiClient.put(`/api/knowledge/faq/${editingDoc.id}`, { question: faqQuestion, answer: faqAnswer });
      } else {
        await apiClient.post('/api/knowledge/faq', { question: faqQuestion, answer: faqAnswer });
      }
      fetchDocuments();
      fetchStats();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save FAQ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitNote = async () => {
    if (!noteTitle || !noteContent) return;
    setIsSubmitting(true);
    try {
      if (editingDoc) {
        await apiClient.put(`/api/knowledge/note/${editingDoc.id}`, { title: noteTitle, content: noteContent });
      } else {
        await apiClient.post('/api/knowledge/note', { title: noteTitle, content: noteContent });
      }
      fetchDocuments();
      fetchStats();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save Note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</span>;
      case 'PENDING':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"><Clock className="w-3 h-3 mr-1" /> Pending</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Processing</span>;
      case 'FAILED':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" /> Failed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Knowledge Management</h1>
          <p className="text-muted-foreground mt-1">Manage documents, URLs, FAQs, and Notes across your organization.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <button onClick={() => setActiveModal('document')} className="crm-button-primary bg-white text-primary border border-primary hover:bg-blue-50 flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Add Document
          </button>
          <button onClick={() => setActiveModal('website')} className="crm-button-primary bg-white text-primary border border-primary hover:bg-blue-50 flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Add Website
          </button>
          <button onClick={() => setActiveModal('faq')} className="crm-button-primary bg-white text-primary border border-primary hover:bg-blue-50 flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Add FAQ
          </button>
          <button onClick={() => setActiveModal('note')} className="crm-button-primary flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Add Note
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Documents', val: stats.total_documents, icon: FileText, color: 'text-blue-600' },
          { label: 'Websites', val: stats.total_urls, icon: Globe, color: 'text-green-600' },
          { label: 'FAQs', val: stats.total_faqs, icon: HelpCircle, color: 'text-orange-600' },
          { label: 'Notes', val: stats.total_notes, icon: StickyNote, color: 'text-yellow-600' },
          { label: 'Total Chunks', val: stats.total_chunks, icon: Database, color: 'text-purple-600' },
        ].map((card) => (
          <div key={card.label} className="crm-card p-4 flex flex-col justify-center items-center text-center">
            <card.icon className={cn("w-6 h-6 mb-2", card.color)} />
            <span className="text-2xl font-bold text-slate-800">{card.val}</span>
            <span className="text-xs font-medium text-slate-500 uppercase">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="crm-card overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex space-x-6">
            {[
              { id: 'all', label: 'All Sources' },
              { id: 'pdf', label: 'Documents' },
              { id: 'url', label: 'Websites' },
              { id: 'faq', label: 'FAQs' },
              { id: 'note', label: 'Notes' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "pb-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search sources..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="crm-input pl-9 h-9 w-full bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-border">
              <tr>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 w-1/3">Title</th>
                <th className="px-6 py-3">Chunks</th>
                <th className="px-6 py-3">Embedding Status</th>
                <th className="px-6 py-3">Last Updated</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading data...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No records found matching your criteria.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 uppercase text-xs">
                      {doc.source_type}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="truncate max-w-sm" title={doc.document}>{doc.document}</div>
                      {doc.source_url && <a href={doc.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline block truncate max-w-sm">{doc.source_url}</a>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {doc.chunks}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(doc.embedding_status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {['faq', 'note'].includes(doc.source_type) && (
                          <button onClick={() => openEditModal(doc)} className="text-slate-400 hover:text-primary transition-colors p-1" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {(doc.embedding_status === 'PENDING' || doc.embedding_status === 'FAILED') && (
                          <button onClick={() => handleReindex(doc.id)} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Reindex">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(doc.id)} className="text-slate-400 hover:text-red-600 transition-colors p-1" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg text-slate-800">
                {activeModal === 'document' && 'Add Document'}
                {activeModal === 'website' && 'Add Website URL'}
                {activeModal === 'faq' && (editingDoc ? 'Edit FAQ' : 'Add FAQ')}
                {activeModal === 'note' && (editingDoc ? 'Edit Note' : 'Add Note')}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>}
              
              {activeModal === 'document' && (
                <div 
                  {...getRootProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center",
                    isDragActive ? 'border-primary bg-blue-50' : 'border-border hover:bg-slate-50',
                    isSubmitting ? 'opacity-50 pointer-events-none' : ''
                  )}
                >
                  <input {...getInputProps()} />
                  {isSubmitting ? (
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  ) : (
                    <FileText className={cn("w-12 h-12 mb-4", isDragActive ? 'text-primary' : 'text-slate-400')} />
                  )}
                  <p className="text-base font-medium text-slate-700">
                    {isSubmitting ? 'Processing Document...' : 'Drag & drop a file here'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Supported formats: PDF, DOCX, TXT</p>
                </div>
              )}

              {activeModal === 'website' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="crm-input w-full"
                      disabled={isSubmitting}
                    />
                  </div>
                  <button onClick={submitUrl} disabled={isSubmitting || !urlInput} className="crm-button-primary w-full flex justify-center items-center">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                    Crawl & Add
                  </button>
                </div>
              )}

              {activeModal === 'faq' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
                    <input
                      type="text"
                      placeholder="e.g. What are your support hours?"
                      value={faqQuestion}
                      onChange={(e) => setFaqQuestion(e.target.value)}
                      className="crm-input w-full"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Answer</label>
                    <textarea
                      placeholder="We are available 24/7..."
                      value={faqAnswer}
                      onChange={(e) => setFaqAnswer(e.target.value)}
                      className="crm-input w-full h-32 resize-y"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={closeModal} className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={submitFaq} disabled={isSubmitting || !faqQuestion || !faqAnswer} className="crm-button-primary flex items-center">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Save FAQ
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'note' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Note Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Sales Playbook Q3"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="crm-input w-full"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
                    <textarea
                      placeholder="Enter detailed notes here..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="crm-input w-full h-48 resize-y"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={closeModal} className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={submitNote} disabled={isSubmitting || !noteTitle || !noteContent} className="crm-button-primary flex items-center">
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Save Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
