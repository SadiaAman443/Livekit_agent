import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { crmApi } from '../api/crm';
import { Lead, Call, Callback } from '../types/crm';
import { Badge, getStatusBadgeVariant } from '../components/ui/Badge';
import { ArrowLeft, Phone, User, Building, Clock, Calendar, FileText } from 'lucide-react';

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
    <details className="text-sm" onToggle={handleToggle}>
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

export const LeadDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [leadData, callsData, callbacksData] = await Promise.all([
        crmApi.getLead(id),
        crmApi.getLeadCalls(id),
        crmApi.getLeadCallbacks(id)
      ]);
      setLead(leadData);
      setCalls(callsData);
      setCallbacks(callbacksData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lead details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!lead) return;
    try {
      const updated = await crmApi.updateLeadStatus(lead.id, e.target.value);
      setLead(updated);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleCallbackStatusChange = async (callbackId: string, newStatus: string) => {
    try {
      const updated = await crmApi.updateCallbackStatus(callbackId, newStatus);
      setCallbacks(callbacks.map(cb => cb.id === callbackId ? updated : cb));
    } catch (err) {
      console.error('Failed to update callback status', err);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading details...</div>;
  if (error || !lead) return <div className="p-8 text-red-500">{error || 'Lead not found'}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button 
        onClick={() => navigate('/leads')}
        className="flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Leads
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Lead Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-border p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-border pb-2">Lead Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">Customer Name</label>
                <div className="flex items-center mt-1 text-slate-800">
                  <User className="w-4 h-4 mr-2 text-slate-400" />
                  {lead.customer_name}
                </div>
              </div>
              
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">Phone</label>
                <div className="flex items-center mt-1 text-slate-800">
                  <Phone className="w-4 h-4 mr-2 text-slate-400" />
                  {lead.phone_number || 'N/A'}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">Project</label>
                <div className="flex items-center mt-1 text-slate-800">
                  <Building className="w-4 h-4 mr-2 text-slate-400" />
                  {lead.project_name || 'N/A'}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-medium">Status</label>
                <div className="mt-2">
                  <select 
                    value={lead.status}
                    onChange={handleStatusChange}
                    className="w-full px-3 py-2 rounded-md border border-border bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="NEW">NEW</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="INTERESTED">INTERESTED</option>
                    <option value="NOT_INTERESTED">NOT INTERESTED</option>
                    <option value="CALLBACK_REQUESTED">CALLBACK REQUESTED</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Callbacks Section */}
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">Callback Requests</h2>
            </div>
            <div className="p-0">
              {callbacks.length === 0 ? (
                <div className="p-6 text-slate-500 text-sm">No callback requests found.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {callbacks.map(cb => (
                    <li key={cb.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-slate-800">Callback Requested</span>
                          <Badge variant={getStatusBadgeVariant(cb.status)}>{cb.status}</Badge>
                        </div>
                        <select
                          value={cb.status}
                          onChange={(e) => handleCallbackStatusChange(cb.id, e.target.value)}
                          className="px-2 py-1 text-xs rounded border border-border bg-white focus:outline-none"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-slate-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                          {cb.callback_date || 'ASAP'} {cb.callback_time || ''}
                        </div>
                        <div className="flex items-start col-span-2">
                          <FileText className="w-4 h-4 mr-2 text-slate-400 mt-0.5" />
                          <span><span className="font-medium">Reason:</span> {cb.reason || 'None provided'}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Calls Section */}
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800">Call History</h2>
            </div>
            <div className="p-0">
              {calls.length === 0 ? (
                <div className="p-6 text-slate-500 text-sm">No calls found.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {calls.map(call => (
                    <li key={call.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-primary" />
                          <span className="font-medium text-slate-800">AI Call Interaction</span>
                        </div>
                        <Badge variant={getStatusBadgeVariant(call.status)}>{call.status}</Badge>
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
                        <div className="text-xs text-slate-400 mb-3 font-mono">
                          Vobiz ID: {call.vobiz_call_id}
                        </div>
                      )}

                      <CallTranscript callId={call.id} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
