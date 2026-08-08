import React, { useState } from 'react';
import { Save, Info } from 'lucide-react';

export const PromptManager: React.FC = () => {
  const [prompt, setPrompt] = useState(
    "You are a helpful, friendly, and concise AI assistant."
  );
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = () => {
    setIsSaving(true);
    setSuccessMsg('');
    // Mock save delay since backend endpoint doesn't exist yet
    setTimeout(() => {
      setIsSaving(false);
      setSuccessMsg('System prompt saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Prompt Manager</h1>
        <p className="text-muted-foreground mt-1">Configure the core instructions and personality of your AI Receptionist.</p>
      </div>

      <div className="crm-card overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">System Prompt</h3>
          {successMsg && <span className="text-sm text-green-600 font-medium">{successMsg}</span>}
        </div>
        
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start mb-6">
            <Info className="w-5 h-5 text-primary mt-0.5 mr-3 shrink-0" />
            <p className="text-sm text-blue-900">
              The system prompt defines how the AI behaves. This context is injected before every user message. 
              Knowledge base retrieval is automatically appended to this prompt during the RAG process.
            </p>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-80 crm-input font-mono text-sm resize-y"
            placeholder="Enter the system instructions here..."
          />

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="crm-button-primary flex items-center disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
