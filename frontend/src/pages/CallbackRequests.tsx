import React, { useEffect, useState, useCallback } from 'react';
import { crmApi } from '../api/crm';
import { Callback } from '../types/crm';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { Search, Phone, Calendar, ChevronLeft, ChevronRight, User, Building, FileText } from 'lucide-react';

export const CallbackRequests: React.FC = () => {
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
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

  const fetchCallbacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const skip = (page - 1) * limit;
      const data = await crmApi.getCallbacks(
        skip,
        limit,
        debouncedSearch || undefined
      );
      setCallbacks(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch callback requests');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchCallbacks();
  }, [fetchCallbacks]);

  const handleCallbackStatusChange = async (callbackId: string, newStatus: string) => {
    try {
      const updated = await crmApi.updateCallbackStatus(callbackId, newStatus);
      setCallbacks(callbacks.map(cb => cb.id === callbackId ? { ...cb, status: updated.status } : cb));
    } catch (err) {
      console.error('Failed to update callback status', err);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Callback Requests</h1>
          <p className="text-slate-500 mt-1">Manage customers who explicitly requested a callback.</p>
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
               Loading callback requests...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">{error}</div>
          ) : callbacks.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No callback requests found matching your criteria.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {callbacks.map(cb => (
                <li key={cb.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-2 text-slate-800 font-semibold mb-1">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{cb.customer_name || 'Unknown'}</span>
                        <Badge variant={getStatusBadgeVariant(cb.status)}>{cb.status}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {cb.phone_number || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <Building className="w-3 h-3 mr-1" />
                          {cb.project_name || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 items-end">
                      <a 
                        href={`tel:${cb.phone_number || ''}`}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors w-full"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call Customer
                      </a>
                      <select
                        value={cb.status}
                        onChange={(e) => handleCallbackStatusChange(cb.id, e.target.value)}
                        className="px-2 py-1 text-xs rounded border border-border bg-white focus:outline-none w-full"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-slate-600 bg-slate-50 border border-slate-200 p-4 rounded-md">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="font-medium mr-2">Requested Time:</span> 
                      {cb.callback_date || 'ASAP'} {cb.callback_time || ''}
                    </div>
                    <div className="flex items-start col-span-2">
                      <FileText className="w-4 h-4 mr-2 text-slate-400 mt-0.5" />
                      <span><span className="font-medium mr-1">Reason:</span> {cb.reason || 'None provided'}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} requests
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
