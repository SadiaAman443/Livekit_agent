import { apiClient } from './client';
import { Lead, Call, Callback } from '../types/crm';

export const crmApi = {
  getLeads: async (status?: string, project_name?: string): Promise<Lead[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (project_name) params.append('project_name', project_name);
    
    const { data } = await apiClient.get(`/api/leads?${params.toString()}`);
    return data;
  },

  getLead: async (id: string): Promise<Lead> => {
    const { data } = await apiClient.get(`/api/leads/${id}`);
    return data;
  },

  getLeadCalls: async (id: string): Promise<Call[]> => {
    const { data } = await apiClient.get(`/api/leads/${id}/calls`);
    return data;
  },

  getLeadCallbacks: async (id: string): Promise<Callback[]> => {
    const { data } = await apiClient.get(`/api/leads/${id}/callbacks`);
    return data;
  },

  updateLeadStatus: async (id: string, status: string): Promise<Lead> => {
    const { data } = await apiClient.patch(`/api/leads/${id}`, { status });
    return data;
  },

  updateCallbackStatus: async (id: string, status: string): Promise<Callback> => {
    const { data } = await apiClient.patch(`/api/callbacks/${id}`, { status });
    return data;
  }
};
