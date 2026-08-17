import React, { useEffect, useState, useCallback } from 'react';
import { crmApi } from '../api/crm';
import { Call } from '../types/crm';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { Search, Phone, Calendar, Clock, ChevronLeft, ChevronRight, User, Building } from 'lucide-react';

const CallTranscript: React.FC<{ callId: string }> = ({ callId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    const detailsOpen = e.currentTarget.open;
    setIsOpen(detailsOpen);
    if (detailsOpen && !transcript) {
      setLoading(true);
      try {
        const fullCall = await crmApi.getCall(callId);
        setTranscript(fullCall.transcript || 'No transcript available.');
      } catch (err) {
        setTranscript('Failed to load transcript.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <details className="text-sm mt-4" onToggle={handleToggle}>
      <summary className="text-primary cursor-pointer hover:underline font-medium">
        View Transcript
      </summary>
      <div className="mt-2 p-3 bg-slate-50 rounded-md border border-slate-200 whitespace-pre-wrap text-slate-600">
        {loading ? (
           <span className="flex items-center text-slate-400">
             <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2"></div>
             Loading...
           </span>
        ) : transcript}
      </div>
    </details>
  );
};

export const CallLogs: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const skip = (page - 1) * limit;
      const data = await crmApi.getCalls(
        skip,
        limit,
        debouncedSearch || undefined
      );
      setCalls(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch calls');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Call Logs</h1>
          <p className="text-slate-500 mt-1">View all AI call interactions.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50/50 flex items-center">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search customer name or phone..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
               <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
               Loading calls...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">{error}</div>
          ) : calls.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No calls found matching your criteria.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {calls.map(call => (
                <li key={call.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-2 text-slate-800 font-semibold mb-1">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{call.customer_name || 'Unknown'}</span>
                        <Badge variant={getStatusBadgeVariant(call.status)}>{call.status}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {call.phone_number || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <Building className="w-3 h-3 mr-1" />
                          {call.project_name || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <a 
                        href={`tel:${call.phone_number || ''}`}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call Customer
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-slate-500 mb-4 space-x-4">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(call.created_at).toLocaleString()}
                    </span>
                    {call.duration_seconds && (
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {call.duration_seconds}s
                      </span>
                    )}
                  </div>

                  {call.summary && (
                    <div className="bg-slate-100 p-3 rounded-md text-sm text-slate-700 mb-3 border border-slate-200">
                      <span className="font-semibold block mb-1">AI Summary:</span>
                      {call.summary}
                    </div>
                  )}

                  {call.recording_url && (
                    <div className="mb-3">
                      <span className="font-semibold text-sm text-slate-700 block mb-1">Recording:</span>
                      <audio controls src={call.recording_url} className="w-full max-w-md h-10">
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  
                  {call.vobiz_call_id && (
                    <div className="text-xs text-slate-400 mb-2 font-mono">
                      Vobiz ID: {call.vobiz_call_id}
                    </div>
                  )}

                  <CallTranscript callId={call.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} calls
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-2 border border-border rounded hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-2 border border-border rounded hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
