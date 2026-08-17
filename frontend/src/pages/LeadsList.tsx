import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmApi } from '../api/crm';
import { Lead } from '../types/crm';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { Search, Filter, Phone, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export const LeadsList: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const skip = (page - 1) * limit;
      const data = await crmApi.getLeads(
        statusFilter || undefined, 
        projectFilter || undefined,
        skip,
        limit,
        debouncedSearch || undefined
      );
      setLeads(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, projectFilter, page, limit, debouncedSearch]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Leads</h1>
          <p className="text-slate-500 mt-1">Manage and track your AI receptionist interactions.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search name or phone..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="flex gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="INTERESTED">Interested</option>
                <option value="CALLBACK_REQUESTED">Callback Requested</option>
              </select>
            </div>
            {/* Can add more filters like project name here if needed */}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
               <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
               Loading leads...
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">{error}</div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No leads found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map(lead => (
                  <tr 
                    key={lead.id} 
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {lead.customer_name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-2 text-slate-400" />
                        {lead.phone_number || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">{lead.project_name || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-2 text-slate-400" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-border bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} leads
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
