import React, { useEffect, useState } from 'react';
import { Activity, FileText, Database, Globe, HelpCircle, StickyNote, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/api/client';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total_documents: 0,
    total_urls: 0,
    total_faqs: 0,
    total_notes: 0,
    total_chunks: 0,
    pending_embeddings: 0,
    completed_embeddings: 0,
    failed_embeddings: 0,
  });

  useEffect(() => {
    apiClient.get('/api/knowledge/stats')
      .then(res => setStats(res.data))
      .catch(console.error);
  }, []);

  const statCards = [
    { name: 'Total Documents', value: stats.total_documents, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Website URLs', value: stats.total_urls, icon: Globe, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'FAQs', value: stats.total_faqs, icon: HelpCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
    { name: 'Notes', value: stats.total_notes, icon: StickyNote, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { name: 'Knowledge Chunks', value: stats.total_chunks, icon: Database, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const embeddingCards = [
    { name: 'Pending Embeddings', value: stats.pending_embeddings, icon: Clock, color: 'text-slate-600', bg: 'bg-slate-100' },
    { name: 'Completed Embeddings', value: stats.completed_embeddings, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Failed Embeddings', value: stats.failed_embeddings, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your Multi-Source AI Receptionist system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="crm-card p-6 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">{stat.name}</p>
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-4">Embedding Pipeline</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {embeddingCards.map((stat) => (
          <div key={stat.name} className="crm-card p-6 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${stat.bg} ${stat.color} shrink-0`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">{stat.name}</p>
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="crm-card p-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">System Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="text-sm font-medium text-slate-600">PostgreSQL Database</span>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Connected</span>
          </div>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="text-sm font-medium text-slate-600">Embedding API</span>
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Pluggable / Ready</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Vector Search</span>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
