import { apiClient } from './client';
import { Lead, Call, Callback, PaginatedLeads, PaginatedCalls, PaginatedCallbacks } from '../types/crm';

export const crmApi = {
  getLeads: async (status?: string, project_name?: string, skip: number = 0, limit: number = 100, search?: string): Promise<PaginatedLeads> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (project_name) params.append('project_name', project_name);
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    
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
  
  getCalls: async (skip: number = 0, limit: number = 100, search?: string): Promise<PaginatedCalls> => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    
    const { data } = await apiClient.get(`/api/calls?${params.toString()}`);
    return data;
  },
  
  getCall: async (id: string): Promise<Call> => {
    const { data } = await apiClient.get(`/api/calls/${id}`);
    return data;
  },

  getCallbacks: async (skip: number = 0, limit: number = 100, search?: string): Promise<PaginatedCallbacks> => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    
    const { data } = await apiClient.get(`/api/callbacks?${params.toString()}`);
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
