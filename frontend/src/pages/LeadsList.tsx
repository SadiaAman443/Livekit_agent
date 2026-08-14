import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmApi } from '../api/crm';
import { Lead } from '../types/crm';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { Search, Filter, Phone, Calendar } from 'lucide-react';

export const LeadsList: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await crmApi.getLeads(statusFilter || undefined, projectFilter || undefined);
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, projectFilter]);

  const filteredLeads = leads.filter(lead => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lead.customer_name.toLowerCase().includes(term) ||
      (lead.phone_number && lead.phone_number.includes(term))
    );
  });

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
                onChange={e => setStatusFilter(e.target.value)}
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
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading leads...</div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">{error}</div>
          ) : filteredLeads.length === 0 ? (
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
                {filteredLeads.map(lead => (
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
      </div>
    </div>
  );
};
