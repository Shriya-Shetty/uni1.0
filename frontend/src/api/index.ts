import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchComplaints = async () => {
  const response = await api.get('/complaints/');
  return response.data;
};

export interface ComplaintCreateData {
  customer_id: string;
  customer_name: string;
  product?: string;
  sub_product?: string;
  issue?: string;
  sub_issue?: string;
  consumer_complaint_narrative: string;
  company?: string;
  state?: string;
  zip_code?: string;
  submitted_via: string;
  consumer_consent_provided?: string;
  financial_impact_amount?: number;
}

export const createComplaint = async (complaintData: ComplaintCreateData) => {
  const response = await api.post('/complaints/', complaintData);
  return response.data;
};

export const updateComplaintStatus = async (complaintId: string, status: string, resolution?: string) => {
  const response = await api.patch(`/complaints/${complaintId}`, { 
    status, 
    company_response_to_consumer: resolution 
  });
  return response.data;
};

export const fetchRootCause = async (product: string) => {
  const response = await api.get(`/analytics/root-cause/${product}`);
  return response.data;
};

export const fetchChatbotResponse = async (message: string, history: any[]) => {
  const response = await api.post('/chatbot/chat', { message, history });
  return response.data;
};

export const extractPdfText = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/channels/pdf-extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const fetchDbStatus = async () => {
  const response = await api.get('/system/db-status');
  return response.data;
};
