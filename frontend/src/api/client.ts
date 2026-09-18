const API_BASE = '/api';

export interface UserPersona {
  id: string;
  name: string;
  role: 'CITIZEN' | 'DEPARTMENT_A' | 'DEPARTMENT_B' | 'DEPARTMENT_C' | 'AUDITOR' | 'ADMIN' | 'OFFICER' | 'SYSTEM_ADMIN';
  email: string;
  mobile: string;
  department_id?: string;
  registration_status?: string;
  token: string;
}

export interface PendingRegistration {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: string;
  registration_status: string;
  created_at: string;
}

export interface CitizenSummary {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: string;
  registration_status: string;
  profile_completion_percentage: number;
  has_profile: boolean;
  has_passport: boolean;
  created_at: string;
}

export interface GovService {
  id: string;
  name: string;
  name_mr?: string;
  department: string;
  description: string;
  description_mr?: string;
  participating_departments: string[];
  sla_days: number;
  is_active: boolean;
}

export interface ApplicationDetail {
  id: string;
  application_number: string;
  citizen_id: string;
  citizen_name: string;
  citizen_mobile: string;
  service_id: string;
  service_name: string;
  status: string;
  current_department: string;
  rejection_reason?: string;
  citizen_data: {
    name?: string;
    mobile?: string;
    dob?: string;
    district?: string;
    annual_income?: number;
    employment_status?: string;
  };
  active_consent?: {
    id: string;
    consent_number: string;
    status: string;
    requested_by: string;
    purpose: string;
    data_categories: string[];
    granted_at?: string;
    consent_hash?: string;
  };
  workflow_steps: Array<{
    id: string;
    step_name: string;
    department_id: string;
    status: string;
    started_at?: string;
    completed_at?: string;
    timestamp?: string;
    verifier_id?: string;
    comments?: string;
    rejection_reason?: string;
    details?: any;
  }>;
  transactions: Array<{
    id: string;
    department_id: string;
    source_department?: string;
    destination_department?: string;
    schema_version?: string;
    operation: string;
    status: string;
    retry_count: number;
    request_payload: any;
    response_payload: any;
    error_message?: string;
    created_at: string;
  }>;
  audit_logs: Array<{
    id: string;
    actor_id: string;
    action: string;
    resource: string;
    metadata: any;
    timestamp: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  total_applications: number;
  integration_success_rate: number;
  avg_processing_time_days: number;
  sla_compliance_rate: number;
  active_in_flight: number;
  department_health: Array<{
    department_id: string;
    name: string;
    type: string;
    status: string;
    requests_count: number;
    success_rate: number;
    avg_latency_ms: number;
    last_sync: string;
    error_count: number;
  }>;
  recent_exceptions: Array<{
    id: string;
    application_id: string;
    application_number: string;
    department_id: string;
    operation: string;
    retry_count: number;
    status: string;
    error_message: string;
    created_at: string;
  }>;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('mahasetu_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async getPersonas(): Promise<UserPersona[]> {
    const res = await fetch(`${API_BASE}/auth/personas`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to fetch personas');
    return res.json();
  },

  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  async register(payload: {
    name: string;
    mobile: string;
    email: string;
    password: string;
    firebase_token?: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async getPendingRegistrations(): Promise<PendingRegistration[]> {
    const res = await fetch(`${API_BASE}/auth/registrations/pending`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch pending registrations');
    return res.json();
  },

  async approveRegistration(userId: string) {
    const res = await fetch(`${API_BASE}/auth/registrations/${userId}/approve`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to approve registration');
    return res.json();
  },

  async rejectRegistration(userId: string, reason: string) {
    const res = await fetch(`${API_BASE}/auth/registrations/${userId}/reject`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error('Failed to reject registration');
    return res.json();
  },

  async getProfile() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  // Resident Profile (Phase 2)
  async getMyResidentProfile() {
    const res = await fetch(`${API_BASE}/citizens/me/profile`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch resident profile');
    return res.json();
  },

  async updateMyResidentProfile(payload: any) {
    const res = await fetch(`${API_BASE}/citizens/me/profile`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update resident profile');
    return res.json();
  },

  async listCitizens(): Promise<CitizenSummary[]> {
    const res = await fetch(`${API_BASE}/citizens`, { headers: getAuthHeader() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch citizens' }));
      throw new Error(err.detail || 'Failed to fetch citizens');
    }
    return res.json();
  },

  async getCitizenProfile(userId: string) {
    const res = await fetch(`${API_BASE}/citizens/${userId}/profile`, { headers: getAuthHeader() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch citizen profile' }));
      throw new Error(err.detail || 'Failed to fetch citizen profile');
    }
    return res.json();
  },

  async uploadPassportDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('mahasetu_token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_BASE}/citizens/me/passport-document`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },

  // Services
  async getServices(): Promise<GovService[]> {
    const res = await fetch(`${API_BASE}/services`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  async getAllServices(includeInactive: boolean = true): Promise<GovService[]> {
    const res = await fetch(`${API_BASE}/services?include_inactive=${includeInactive}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch services catalogue');
    return res.json();
  },

  async getService(id: string): Promise<GovService> {
    const res = await fetch(`${API_BASE}/services/${id}`);
    if (!res.ok) throw new Error('Service not found');
    return res.json();
  },

  async createService(data: GovService): Promise<GovService> {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create service' }));
      throw new Error(err.detail || 'Failed to create service');
    }
    return res.json();
  },

  async updateService(id: string, data: Partial<GovService>): Promise<GovService> {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update service' }));
      throw new Error(err.detail || 'Failed to update service');
    }
    return res.json();
  },

  async deleteService(id: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to delete service' }));
      throw new Error(err.detail || 'Failed to delete service');
    }
    return res.json();
  },

  // Applications
  async createApplication(payload: {
    service_id: string;
    citizen_name: string;
    mobile: string;
    dob: string;
    district: string;
    annual_income?: number;
    employment_status?: string;
  }): Promise<ApplicationDetail> {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to create application');
    return res.json();
  },

  async getApplications(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/applications`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch applications');
    return res.json();
  },

  async getApplication(idOrNumber: string): Promise<ApplicationDetail> {
    const res = await fetch(`${API_BASE}/applications/${idOrNumber}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Application not found');
    return res.json();
  },

  // Consents
  async approveConsent(consentId: string) {
    const res = await fetch(`${API_BASE}/consents/${consentId}/approve`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to approve consent');
    return res.json();
  },

  async revokeConsent(consentId: string) {
    const res = await fetch(`${API_BASE}/consents/${consentId}/revoke`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to revoke consent');
    return res.json();
  },

  // Workflow
  async advanceWorkflow(appId: string) {
    const res = await fetch(`${API_BASE}/workflow/${appId}/advance`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to advance workflow' }));
      throw new Error(err.detail || 'Failed to advance workflow');
    }
    return res.json();
  },

  async runAllWorkflow(appId: string) {
    const res = await fetch(`${API_BASE}/workflow/${appId}/run-all`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to run full workflow');
    return res.json();
  },

  async retryWorkflow(appId: string) {
    const res = await fetch(`${API_BASE}/workflow/${appId}/retry`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to retry workflow');
    return res.json();
  },

  async adminReviewWorkflow(appId: string, payload: { decision: 'APPROVE' | 'REWORK', comments?: string, rejection_reason?: string }) {
    const res = await fetch(`${API_BASE}/workflow/${appId}/admin-review`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to submit admin review' }));
      throw new Error(err.detail || 'Failed to submit admin review');
    }
    return res.json();
  },

  async auditorReviewWorkflow(appId: string, payload: { decision: 'CONFIRM' | 'FLAG', comments?: string }) {
    const res = await fetch(`${API_BASE}/workflow/${appId}/auditor-review`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to submit auditor review' }));
      throw new Error(err.detail || 'Failed to submit auditor review');
    }
    return res.json();
  },

  async resubmitApplication(appId: string, payload: { citizen_data?: Record<string, any>, comments?: string }) {
    const res = await fetch(`${API_BASE}/applications/${appId}/resubmit`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to resubmit application' }));
      throw new Error(err.detail || 'Failed to resubmit application');
    }
    return res.json();
  },

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await fetch(`${API_BASE}/dashboard/metrics`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
    return res.json();
  },

  async getRecentTransactions(limit: number = 25): Promise<Array<{
    id: string;
    application_id: string;
    application_number: string;
    department_id: string;
    source_department: string;
    destination_department: string;
    schema_version: string;
    operation: string;
    status: string;
    retry_count: number;
    error_message?: string;
    created_at: string;
  }>> {
    const res = await fetch(`${API_BASE}/dashboard/transactions?limit=${limit}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async getIntegrations() {
    const res = await fetch(`${API_BASE}/dashboard/integrations`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch integrations');
    return res.json();
  },

  async getExceptions() {
    const res = await fetch(`${API_BASE}/dashboard/exceptions`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch exceptions');
    return res.json();
  },

  async getAuditLogs(limit: number = 40) {
    const res = await fetch(`${API_BASE}/dashboard/audit-logs?limit=${limit}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getAuditLogsFiltered(params: {
    application_id?: string;
    actor_id?: string;
    action?: string;
    resource?: string;
    search?: string;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.application_id) query.set('application_id', params.application_id);
    if (params.actor_id) query.set('actor_id', params.actor_id);
    if (params.action) query.set('action', params.action);
    if (params.resource) query.set('resource', params.resource);
    if (params.search) query.set('search', params.search);
    if (params.from_date) query.set('from_date', params.from_date);
    if (params.to_date) query.set('to_date', params.to_date);
    if (params.skip !== undefined) query.set('skip', params.skip.toString());
    if (params.limit !== undefined) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/audit-logs?${query.toString()}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch filtered audit logs');
    return res.json();
  },

  async getAuditSummary() {
    const res = await fetch(`${API_BASE}/audit-logs/summary`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch audit summary');
    return res.json();
  },

  async exportAuditCsv(params: { application_id?: string; action?: string; resource?: string } = {}) {
    const query = new URLSearchParams();
    if (params.application_id) query.set('application_id', params.application_id);
    if (params.action) query.set('action', params.action);
    if (params.resource) query.set('resource', params.resource);

    const res = await fetch(`${API_BASE}/audit-logs/export/csv?${query.toString()}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to export audit CSV');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mahasetu_audit_compliance_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async exportAuditJson(params: { application_id?: string; action?: string } = {}) {
    const query = new URLSearchParams();
    if (params.application_id) query.set('application_id', params.application_id);
    if (params.action) query.set('action', params.action);

    const res = await fetch(`${API_BASE}/audit-logs/export/json?${query.toString()}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to export audit JSON');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mahasetu_audit_compliance_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async getSchemaAssistant() {
    const res = await fetch(`${API_BASE}/dashboard/schema-assistant`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch schema suggestions');
    return res.json();
  },

  // Demo Simulation
  async getDemoStatus() {
    const res = await fetch(`${API_BASE}/demo/status`);
    if (!res.ok) throw new Error('Failed to fetch demo status');
    return res.json();
  },

  async toggleFailure(enabled?: boolean) {
    const url = enabled !== undefined ? `${API_BASE}/demo/toggle-failure?enabled=${enabled}` : `${API_BASE}/demo/toggle-failure`;
    const res = await fetch(url, { method: 'POST', headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to toggle failure');
    return res.json();
  },

  // Transformation Trace
  async traceTransformation(src: string, tgt: string, payload?: any) {
    const res = await fetch(`${API_BASE}/integrations/transform/trace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_department: src, target_department: tgt, payload })
    });
    if (!res.ok) throw new Error('Failed to trace transformation');
    return res.json();
  },

  // Grievances
  async getGrievances(applicationId?: string): Promise<any[]> {
    const url = applicationId ? `${API_BASE}/grievances?application_id=${applicationId}` : `${API_BASE}/grievances`;
    const res = await fetch(url, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch grievances');
    return res.json();
  },

  async createGrievance(payload: {
    application_id: string;
    department_id: string;
    category: string;
    description: string;
  }) {
    const res = await fetch(`${API_BASE}/grievances`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit grievance');
    return res.json();
  },

  async resolveGrievance(grievanceId: string, resolution_notes: string) {
    const res = await fetch(`${API_BASE}/grievances/${grievanceId}/resolve`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ resolution_notes })
    });
    if (!res.ok) throw new Error('Failed to resolve grievance');
    return res.json();
  },

  // Digital Service Passport
  async getPassportCertificate(applicationId: string) {
    const res = await fetch(`${API_BASE}/passport/${applicationId}/certificate`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to generate service passport');
    return res.json();
  },

  async verifyPassport(idOrHash: string) {
    const res = await fetch(`${API_BASE}/passport/verify/${idOrHash}`);
    if (!res.ok) throw new Error('Failed to verify service passport');
    return res.json();
  },

  // Connector Studio
  async getStudioConnectors() {
    const res = await fetch(`${API_BASE}/connectors-studio/registered`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch studio connectors');
    return res.json();
  },

  async testCustomTransformation(payload: {
    connector_id: string;
    connector_name: string;
    protocol: string;
    sample_payload: any;
  }) {
    const res = await fetch(`${API_BASE}/connectors-studio/test-transform`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to test transformation');
    return res.json();
  },

  // SLA Engine (Phase 3)
  async getSLAMonitoring() {
    const res = await fetch(`${API_BASE}/sla/monitoring`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch SLA monitoring telemetry');
    return res.json();
  },

  async escalateSLA(applicationId: string) {
    const res = await fetch(`${API_BASE}/sla/${applicationId}/escalate`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to expedite application SLA');
    return res.json();
  },

  // Event Telemetry Radar (Phase 3)
  async getLiveEventsFeed(limit: number = 25) {
    const res = await fetch(`${API_BASE}/events/live-feed?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch live events telemetry');
    return res.json();
  },

  async simulatePulse() {
    const res = await fetch(`${API_BASE}/events/simulate-pulse`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to simulate packet pulse');
    return res.json();
  },

  // Phase 4: Executive Audit, Lineage & Edge Sync
  async getExecutiveAuditReport() {
    const res = await fetch(`${API_BASE}/reports/executive-audit`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch executive audit report');
    return res.json();
  },

  async getDataLineage(applicationId: string) {
    const res = await fetch(`${API_BASE}/lineage/${applicationId}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch data lineage');
    return res.json();
  },

  async getEdgeSyncStatus() {
    const res = await fetch(`${API_BASE}/edge-sync/status`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch edge sync status');
    return res.json();
  },

  async simulateEdgeBatchSync(payload: {
    center_id: string;
    taluka_name: string;
    district_name: string;
    offline_packets_count: number;
  }) {
    const res = await fetch(`${API_BASE}/edge-sync/batch-upload`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to execute batch edge sync');
    return res.json();
  },

  // Phase 5: Fraud Detection, Policy Simulator & Security Audit
  async getFraudAnomalies() {
    const res = await fetch(`${API_BASE}/fraud/anomalies`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch fraud anomalies');
    return res.json();
  },

  async resolveFraudAnomaly(anomalyId: string, action: string, officerNotes: string) {
    const res = await fetch(`${API_BASE}/fraud/${anomalyId}/resolve`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ action, officer_notes: officerNotes })
    });
    if (!res.ok) throw new Error('Failed to resolve anomaly');
    return res.json();
  },

  async evaluatePolicyScenario(payload: {
    scheme_id: string;
    income_ceiling_inr: number;
    target_districts_count: number;
    sla_target_hours: number;
    include_legacy_sync: boolean;
  }) {
    const res = await fetch(`${API_BASE}/simulator/evaluate`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to evaluate policy scenario');
    return res.json();
  },

  async getSecurityAudit() {
    const res = await fetch(`${API_BASE}/security/audit`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch security audit');
    return res.json();
  },

  // Phase 6: Voice Assistant, National DPI, DBT Ledger & Field Verification
  async queryMahaSetuVaani(queryText: string, language: string = 'mr') {
    const res = await fetch(`${API_BASE}/vaani/query`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ query_text: queryText, language })
    });
    if (!res.ok) throw new Error('Failed to process voice query');
    return res.json();
  },

  async getDPIGatewayStatus() {
    const res = await fetch(`${API_BASE}/dpi/status`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch DPI gateway status');
    return res.json();
  },

  async testDPIHandshake(targetDpiId: string) {
    const res = await fetch(`${API_BASE}/dpi/test-handshake`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ target_dpi_id: targetDpiId })
    });
    if (!res.ok) throw new Error('Failed to test DPI handshake');
    return res.json();
  },

  async getDBTDisbursals() {
    const res = await fetch(`${API_BASE}/disbursal/transactions`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch DBT disbursals');
    return res.json();
  },

  async getFieldInspections() {
    const res = await fetch(`${API_BASE}/field/inspections`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch field inspections');
    return res.json();
  },

  async submitFieldInspection(payload: {
    application_number: string;
    beneficiary_name: string;
    inspector_name: string;
    taluka: string;
    district: string;
    latitude: number;
    longitude: number;
    inspection_notes: string;
    recommendation: string;
  }) {
    const res = await fetch(`${API_BASE}/field/verify-inspection`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit field inspection');
    return res.json();
  },

  // Phase 7: Sovereign Credentials & ZKP
  async getVerifiableCredentials(citizenMobile?: string) {
    let mobile = citizenMobile;
    if (!mobile) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.mobile) mobile = parsed.mobile;
        }
      } catch (e) {}
    }
    if (!mobile) mobile = '9999999999';
    const res = await fetch(`${API_BASE}/vc/wallet?citizen_mobile=${encodeURIComponent(mobile)}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch verifiable credentials wallet');
    return res.json();
  },

  async generateZKPProof(claims: string[], verifierAudience: string = 'DEPT_B_ELIGIBILITY_EVALUATION') {
    const res = await fetch(`${API_BASE}/vc/generate-zkp`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ claims_to_prove: claims, verifier_audience: verifierAudience })
    });
    if (!res.ok) throw new Error('Failed to generate Zero-Knowledge Proof');
    return res.json();
  },

  async verifyZKPProof(payload: {
    proof_token: string;
    issuer_did: string;
    claims_proved: string[];
    cryptographic_digest: string;
    timestamp: string;
  }) {
    const res = await fetch(`${API_BASE}/vc/verify-proof`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to verify Zero-Knowledge Proof');
    return res.json();
  },

  // Phase 7: MahaDarpan District Collectorate Cockpit
  async getDistrictCockpitSummary() {
    const res = await fetch(`${API_BASE}/district-cockpit/summary`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch district cockpit summary');
    return res.json();
  },

  async getDistrictDetails(district: string) {
    const res = await fetch(`${API_BASE}/district-cockpit/district/${encodeURIComponent(district)}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error(`Failed to fetch details for district ${district}`);
    return res.json();
  },

  async dispatchDistrictAction(payload: {
    district: string;
    action_type: string;
    officer_instructions: string;
    authorized_by?: string;
  }) {
    const res = await fetch(`${API_BASE}/district-cockpit/dispatch-action`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to dispatch district administrative action');
    return res.json();
  },

  // Phase 7: MahaSetu Nivarana (AI Grievance Ombudsperson)
  async getNivaranaCases() {
    const res = await fetch(`${API_BASE}/nivarana/cases`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch Nivarana ombudsperson cases');
    return res.json();
  },

  async submitNivaranaGrievance(payload: {
    application_number: string;
    citizen_name: string;
    citizen_mobile?: string;
    district?: string;
    category?: string;
    description: string;
  }) {
    const res = await fetch(`${API_BASE}/nivarana/submit`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit citizen grievance');
    return res.json();
  },

  async remediateNivaranaCase(payload: {
    case_id: string;
    action: string;
    officer_notes: string;
    officer_name?: string;
  }) {
    const res = await fetch(`${API_BASE}/nivarana/remediate`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to execute ombudsperson remediation');
    return res.json();
  },

  // Phase 7: Interoperability Webhook Mesh
  async getWebhookSubscriptions() {
    const res = await fetch(`${API_BASE}/webhooks/subscriptions`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch webhook subscriptions');
    return res.json();
  },

  async dispatchTestWebhook(subscriptionId: string, eventType: string = 'INTEROP_PACKET_VERIFIED') {
    const res = await fetch(`${API_BASE}/webhooks/dispatch-test`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ subscription_id: subscriptionId, event_type: eventType })
    });
    if (!res.ok) throw new Error('Failed to dispatch test webhook');
    return res.json();
  },

  // Phase 7: ChaosSetu Resilience Simulator
  async getChaosStatus() {
    const res = await fetch(`${API_BASE}/chaos/status`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch chaos simulator status');
    return res.json();
  },

  async triggerChaosExperiment(experimentId: string, intensity: string = 'HIGH') {
    const res = await fetch(`${API_BASE}/chaos/trigger`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ experiment_id: experimentId, intensity: intensity })
    });
    if (!res.ok) throw new Error('Failed to trigger chaos fault injection');
    return res.json();
  },

  async resetChaosBaseline() {
    const res = await fetch(`${API_BASE}/chaos/reset`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to reset chaos baseline');
    return res.json();
  },

  // Phase 8: Confidential Multi-Party Computing (MahaVault)
  async getMPCSessions() {
    const res = await fetch(`${API_BASE}/mpc/sessions`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch confidential MPC sessions');
    return res.json();
  },

  async verifyBlindMatch(payload: {
    citizen_blind_hash?: string;
    party_a_id: string;
    party_b_id: string;
    criterion: string;
  }) {
    const res = await fetch(`${API_BASE}/mpc/verify-blind-match`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to execute blind Private Set Intersection');
    return res.json();
  },

  // Phase 8: Inter-State Portability Bridge
  async getInterstateTrustAnchors() {
    const res = await fetch(`${API_BASE}/interstate/trust-anchors`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch interstate trust anchors');
    return res.json();
  },

  async portCitizenCredentials(payload: {
    application_number: string;
    citizen_name: string;
    source_state: string;
    target_state_id: string;
    migration_reason: string;
  }) {
    const res = await fetch(`${API_BASE}/interstate/port-credentials`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to port credentials to interstate gateway');
    return res.json();
  },

  // Phase 8: Proactive AI Entitlement Engine (MahaPrerna)
  async getProactiveRecommendations(citizenMobile: string = '9999999999') {
    const res = await fetch(`${API_BASE}/entitlements/recommendations?citizen_mobile=${citizenMobile}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch proactive welfare recommendations');
    return res.json();
  },

  async autoDraftSchemeBundle(payload: {
    citizen_mobile?: string;
    selected_scheme_ids: string[];
  }) {
    const res = await fetch(`${API_BASE}/entitlements/auto-draft`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to auto-draft scheme application bundle');
    return res.json();
  },

  // Phase 8: Green GovTech Carbon Offset Ledger (MahaHarit)
  async getGreenFootprint() {
    const res = await fetch(`${API_BASE}/green/footprint`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch green environmental footprint metrics');
    return res.json();
  },

  async getDistrictGreenCertificate(districtName: string) {
    const res = await fetch(`${API_BASE}/green/certificate/${encodeURIComponent(districtName)}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error(`Failed to fetch eco-governance certificate for ${districtName}`);
    return res.json();
  },

  // Phase 8: Post-Quantum Cryptography Sandbox
  async getPQCQuantumAssessment() {
    const res = await fetch(`${API_BASE}/pqc/assessment`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch PQC quantum risk scorecard');
    return res.json();
  },

  async simulateHybridPQC(payload: {
    department_id: string;
    packet_id: string;
  }) {
    const res = await fetch(`${API_BASE}/pqc/simulate-hybrid-handshake`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to simulate hybrid quantum-safe handshake');
    return res.json();
  },

  // Phase 9: MahaAapada — Disaster Surge & Emergency Relief Mesh
  async getActiveDisasterEvents() {
    const res = await fetch(`${API_BASE}/disaster/active-events`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch active disaster emergency events');
    return res.json();
  },

  async triggerDisasterRelief(payload: {
    event_id: string;
    target_district: string;
    authorized_officer_badge: string;
  }) {
    const res = await fetch(`${API_BASE}/disaster/trigger-emergency-relief`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to trigger emergency disaster relief disbursals');
    return res.json();
  },

  // Phase 9: MahaNirasana — DPDP Right-to-be-Forgotten & Privacy Ledger
  async getDPDPPrivacyScorecard(citizenMobile: string = '9999999999') {
    const res = await fetch(`${API_BASE}/dpdp-erasure/privacy-scorecard?citizen_mobile=${citizenMobile}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch DPDP privacy exposure scorecard');
    return res.json();
  },

  async requestDPDPErasure(payload: {
    citizen_mobile: string;
    requested_departments: string[];
    reason: string;
  }) {
    const res = await fetch(`${API_BASE}/dpdp-erasure/request-erasure`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to execute DPDP Right-to-be-Forgotten erasure');
    return res.json();
  },

  // Phase 9: MahaSatya — Multi-Modal AI Document Forensics
  async getForensicsHistory() {
    const res = await fetch(`${API_BASE}/document-forensics/history`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch document forensics history');
    return res.json();
  },

  async analyzeDocumentForensics(payload: {
    document_name: string;
    doc_type: string;
    simulate_tamper: boolean;
  }) {
    const res = await fetch(`${API_BASE}/document-forensics/analyze`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to analyze document forensics');
    return res.json();
  },

  // Phase 9: MahaChaitanya — Autonomous Self-Regulating Mesh
  async getAutonomousMeshHealth() {
    const res = await fetch(`${API_BASE}/mesh-autonomous/health`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch autonomous mesh health status');
    return res.json();
  },

  async tuneAutonomousMesh(policyMode: string = 'AGGRESSIVE_STABILIZATION') {
    const res = await fetch(`${API_BASE}/mesh-autonomous/tune`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ policy_mode: policyMode })
    });
    if (!res.ok) throw new Error('Failed to execute autonomous mesh tuning');
    return res.json();
  },

  // Phase 9: MahaSetu Developer SDK & Certification Sandbox
  async getCertifiedSDKPartners() {
    const res = await fetch(`${API_BASE}/developer-sdk/certified-partners`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch certified SDK partners');
    return res.json();
  },

  async certifyConnectorSDK(payload: {
    organization_name: string;
    service_domain: string;
    sample_payload?: any;
  }) {
    const res = await fetch(`${API_BASE}/developer-sdk/certify-connector`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to certify connector');
    return res.json();
  },

  async testSDKPayload(payload: {
    source_schema_name: string;
    payload: any;
  }) {
    const res = await fetch(`${API_BASE}/developer-sdk/test-payload`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to test sandbox payload');
    return res.json();
  },

  // Phase 10: Chief Minister's Executive War Room (MahaDrishti)
  async getWarRoomMacroPulse() {
    const res = await fetch(`${API_BASE}/war-room/macro-pulse`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch war room macro pulse');
    return res.json();
  },

  async simulatePolicyShift(payload: {
    welfare_budget_multiplier: number;
    income_ceiling_expansion_pct: number;
    fast_track_sla_days: number;
  }) {
    const res = await fetch(`${API_BASE}/war-room/simulate-policy-shift`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to simulate macro policy shift');
    return res.json();
  },

  // Phase 10: Zero-Trust Merkle Tree Audit Notary (MahaLekha)
  async getMerkleBlocks() {
    const res = await fetch(`${API_BASE}/merkle-ledger/blocks`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch Merkle blocks');
    return res.json();
  },

  async verifyMerkleInclusion(payload: {
    application_number: string;
    block_number: number;
  }) {
    const res = await fetch(`${API_BASE}/merkle-ledger/verify-inclusion`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to verify Merkle inclusion proof');
    return res.json();
  },

  // Phase 10: Global Diaspora & NRI Attestation Gateway (MahaPravasi)
  async getDiasporaRequests() {
    const res = await fetch(`${API_BASE}/diaspora/attestation-requests`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch diaspora attestation requests');
    return res.json();
  },

  async attestDocumentDiaspora(payload: {
    citizen_name: string;
    passport_number: string;
    destination_country: string;
    document_type: string;
    source_application_number: string;
  }) {
    const res = await fetch(`${API_BASE}/diaspora/attest-document`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to issue diaspora apostille attestation');
    return res.json();
  },

  // Phase 10: Autonomous AI Workload Rebalancer (MahaKarma)
  async getWorkforceOfficerLoad() {
    const res = await fetch(`${API_BASE}/workforce/officer-load`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch workforce desk loads');
    return res.json();
  },

  async rebalanceWorkforce(priorityLevel: string = 'MAX_EQUALIZATION') {
    const res = await fetch(`${API_BASE}/workforce/rebalance-workload`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ priority_level: priorityLevel })
    });
    if (!res.ok) throw new Error('Failed to execute AI workforce rebalancing');
    return res.json();
  },

  // Phase 10: Grand Capstone Demonstration Hub
  async getCapstoneSummary() {
    const res = await fetch(`${API_BASE}/capstone-demo/summary`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch capstone demonstration summary');
    return res.json();
  },

  async runCapstoneEndToEnd() {
    const res = await fetch(`${API_BASE}/capstone-demo/run-end-to-end`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to execute capstone end-to-end simulation');
    return res.json();
  },

  // Phase 11: Programmable e-RUPI Smart Escrow (MahaKosh)
  async getActiveEscrowVouchers() {
    const res = await fetch(`${API_BASE}/escrow/active-vouchers`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch escrow vouchers');
    return res.json();
  },

  async mintEscrowVoucher(payload: {
    beneficiary_name: string;
    aadhaar_last_four: string;
    amount_inr: number;
    purpose_category: string;
  }) {
    const res = await fetch(`${API_BASE}/escrow/mint-voucher`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to mint programmable voucher');
    return res.json();
  },

  async redeemEscrowVoucher(payload: {
    voucher_id: string;
    merchant_id: string;
    merchant_mcc: string;
    otp_code: string;
  }) {
    const res = await fetch(`${API_BASE}/escrow/redeem-voucher`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to redeem escrow voucher');
    return res.json();
  },

  // Phase 11: Satellite Bhoomi Geo-Cadastre (MahaBhoomi)
  async getBhoomiParcels() {
    const res = await fetch(`${API_BASE}/bhoomi-cadastre/parcels`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch Bhoomi parcels');
    return res.json();
  },

  async verifyBhoomiPolygon(payload: {
    gat_number: string;
    district: string;
    taluka: string;
    latitude: number;
    longitude: number;
  }) {
    const res = await fetch(`${API_BASE}/bhoomi-cadastre/verify-polygon`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to verify cadastral polygon');
    return res.json();
  },

  // Phase 11: Multi-Agent RTSA Tribunal (MahaNyaya)
  async getTribunalDisputes() {
    const res = await fetch(`${API_BASE}/tribunal-nyaya/disputes`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch tribunal disputes');
    return res.json();
  },

  async arbitrateTribunalDispute(caseNumber: string) {
    const res = await fetch(`${API_BASE}/tribunal-nyaya/arbitrate`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ case_number: caseNumber })
    });
    if (!res.ok) throw new Error('Failed to arbitrate tribunal case');
    return res.json();
  },

  // Phase 11: Universal Divyangjan Accessibility (MahaSugamya)
  async getAccessibilityProfiles() {
    const res = await fetch(`${API_BASE}/accessibility/profiles`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch accessibility profiles');
    return res.json();
  },

  async synthesizeAccessibilityNarration(payload: {
    text_content: string;
    language?: string;
  }) {
    const res = await fetch(`${API_BASE}/accessibility/synthesize-narration`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to synthesize accessible narration');
    return res.json();
  },

  // Phase 11: Tribal Forest Rights Cadastre (MahaVanadhikar)
  async getFRAClaims() {
    const res = await fetch(`${API_BASE}/vanadhikar-fra/claims`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch FRA claims');
    return res.json();
  },

  async reconcileFRAClaim(payload: {
    claim_id: string;
    district_collector_signoff?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/vanadhikar-fra/reconcile-claim`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ district_collector_signoff: true, ...payload })
    });
    if (!res.ok) throw new Error('Failed to reconcile FRA claim');
    return res.json();
  },

  // Phase 12: State Treasury & BeAMS Liquidity Auditor (MahaNidhi)
  async getTreasuryLiquidityPulse() {
    const res = await fetch(`${API_BASE}/treasury-beams/liquidity-pulse`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch treasury liquidity pulse');
    return res.json();
  },

  async reconcileTreasurySanction(payload: {
    department: string;
    scheme_code: string;
    requested_amount_cr: number;
  }) {
    const res = await fetch(`${API_BASE}/treasury-beams/reconcile-sanction`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to reconcile treasury sanction');
    return res.json();
  },

  // Phase 12: Municipal Smart Tender Collusion Shield (MahaTender)
  async getActiveTenders() {
    const res = await fetch(`${API_BASE}/tender-shield/active-tenders`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch active municipal tenders');
    return res.json();
  },

  async analyzeTenderBids(tenderId: string) {
    const res = await fetch(`${API_BASE}/tender-shield/analyze-bids`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ tender_id: tenderId })
    });
    if (!res.ok) throw new Error('Failed to analyze tender bids for collusion');
    return res.json();
  },

  // Phase 12: Crisis Evacuation & Logistics Mesh (MahaRahat)
  async getCrisisEvacuationNodes() {
    const res = await fetch(`${API_BASE}/crisis-logistics/evacuation-nodes`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch crisis evacuation nodes');
    return res.json();
  },

  async activateCrisisCorridor(payload: {
    source_node: string;
    destination_cluster: string;
    payload_type: string;
  }) {
    const res = await fetch(`${API_BASE}/crisis-logistics/dispatch-corridor`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to activate drone medical corridor');
    return res.json();
  },

  // Phase 12: Quantum HSM Key Rotation (MahaChabi)
  async getQuantumKeyRings() {
    const res = await fetch(`${API_BASE}/key-rotation/ring-status`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch HSM key rings');
    return res.json();
  },

  async rotateQuantumKey(keyRingId: string) {
    const res = await fetch(`${API_BASE}/key-rotation/rotate-now`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ key_ring_id: keyRingId })
    });
    if (!res.ok) throw new Error('Failed to rotate quantum key ring');
    return res.json();
  },

  // Phase 12: Drone AI Crop Loss & PMFBY Settlement (MahaPahani)
  async getDronePMFBYSurveys() {
    const res = await fetch(`${API_BASE}/drone-pmfby/surveys`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch drone PMFBY surveys');
    return res.json();
  },

  async settleDronePMFBYClaim(surveyId: string) {
    const res = await fetch(`${API_BASE}/drone-pmfby/settle-claim`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ survey_id: surveyId })
    });
    if (!res.ok) throw new Error('Failed to settle drone PMFBY claim');
    return res.json();
  },

  // Phase 13: Proactive Life-Events Mesh (MahaJeevan)
  async getProactiveLifeEvents() {
    const res = await fetch(`${API_BASE}/life-events/proactive-triggers`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch proactive life events');
    return res.json();
  },

  async dispatchProactiveEntitlement(payload: {
    event_id: string;
    send_citizen_consent_sms?: boolean;
  }) {
    const res = await fetch(`${API_BASE}/life-events/dispatch-entitlement`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ send_citizen_consent_sms: true, ...payload })
    });
    if (!res.ok) throw new Error('Failed to dispatch proactive entitlement');
    return res.json();
  },

  // Phase 13: Predictive Epidemic Surveillance (MahaArogya)
  async getEpidemicWardClusters() {
    const res = await fetch(`${API_BASE}/epidemic-health/ward-clusters`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch epidemic ward clusters');
    return res.json();
  },

  async forecastVectorOutbreak(clusterId: string) {
    const res = await fetch(`${API_BASE}/epidemic-health/forecast-outbreak`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ cluster_id: clusterId })
    });
    if (!res.ok) throw new Error('Failed to forecast vector outbreak');
    return res.json();
  },

  // Phase 13: Zero-Knowledge Property Tax & Stamp Duty (MahaKar)
  async getReadyReckonerRates() {
    const res = await fetch(`${API_BASE}/zk-taxation/reckoner-rates`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch ready reckoner rates');
    return res.json();
  },

  async assessZKPropertyDuty(payload: {
    zone_code: string;
    carpet_area_sqft: number;
    declared_transaction_value_inr: number;
  }) {
    const res = await fetch(`${API_BASE}/zk-taxation/assess-duty`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to assess ZK stamp duty');
    return res.json();
  },

  // Phase 13: Gramin Kiosk Solar Microgrid Telemetry (MahaUrja)
  async getSolarKioskTelemetry() {
    const res = await fetch(`${API_BASE}/kiosk-solar/kiosk-telemetry`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch solar kiosk telemetry');
    return res.json();
  },

  async optimizeKioskPowerProfile(kioskId: string) {
    const res = await fetch(`${API_BASE}/kiosk-solar/optimize-power`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ kiosk_id: kioskId })
    });
    if (!res.ok) throw new Error('Failed to optimize kiosk power profile');
    return res.json();
  },

  // Phase 13: Dialectal Voice Hotline Agent (MahaSanvad)
  async getVoiceHotlineDialects() {
    const res = await fetch(`${API_BASE}/voice-hotline/dialects`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch voice hotline dialects');
    return res.json();
  },

  async converseWithVoiceHotline(payload: {
    dialect_code: string;
    citizen_speech_input: string;
  }) {
    const res = await fetch(`${API_BASE}/voice-hotline/converse`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to converse with voice hotline');
    return res.json();
  },

  // Phase 14: PDS Ration Supply Chain (MahaAnna)
  async getPDSRationNodes() {
    const res = await fetch(`${API_BASE}/pds-ration/fps-nodes`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch PDS ration nodes');
    return res.json();
  },

  async dispatchPDSReplenishment(payload: {
    fps_id: string;
    replenish_quintals: number;
  }) {
    const res = await fetch(`${API_BASE}/pds-ration/dispatch-replenishment`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to dispatch PDS grain replenishment');
    return res.json();
  },

  // Phase 14: Jal Jeevan Aquifer Telemetry (MahaJal)
  async getJalJeevanSensors() {
    const res = await fetch(`${API_BASE}/jal-jeevan/aquifer-sensors`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch aquifer sensors');
    return res.json();
  },

  async dispatchJalJeevanTanker(payload: {
    sensor_id: string;
    tanker_capacity_litres?: number;
  }) {
    const res = await fetch(`${API_BASE}/jal-jeevan/dispatch-tanker`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ tanker_capacity_litres: 12000, ...payload })
    });
    if (!res.ok) throw new Error('Failed to dispatch emergency water tanker');
    return res.json();
  },

  // Phase 14: EV Smart Charging Grid (MahaGati)
  async getEVChargingHubs() {
    const res = await fetch(`${API_BASE}/ev-grid/charging-hubs`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch EV charging hubs');
    return res.json();
  },

  async balanceEVGridLoad(hubId: string) {
    const res = await fetch(`${API_BASE}/ev-grid/balance-charge`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ hub_id: hubId })
    });
    if (!res.ok) throw new Error('Failed to balance EV grid load');
    return res.json();
  },

  // Phase 14: Police CCTNS Citizen Station (MahaRakshak)
  async getPoliceCCTNSRecords() {
    const res = await fetch(`${API_BASE}/police-cctns/recent-records`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch police CCTNS records');
    return res.json();
  },

  async filePoliceLostProperty(payload: {
    citizen_name: string;
    contact_phone: string;
    item_lost: string;
    incident_location: string;
    police_station: string;
  }) {
    const res = await fetch(`${API_BASE}/police-cctns/file-lost-property`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to file lost property NC report');
    return res.json();
  },

  // Phase 14: MeriPehchaan National SSO (MahaPehchaan)
  async getMeriPehchaanFederationStatus() {
    const res = await fetch(`${API_BASE}/meripehchaan-sso/federation-status`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch MeriPehchaan federation status');
    return res.json();
  },

  async exchangeMeriPehchaanToken(payload: {
    meripehchaan_id_token?: string;
    citizen_name: string;
    home_state: string;
    digilocker_linked_uid?: string;
  }) {
    const res = await fetch(`${API_BASE}/meripehchaan-sso/exchange-token`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({
        meripehchaan_id_token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.meripehchaan.national.gov.in',
        digilocker_linked_uid: 'vault:uidai:109238475612',
        ...payload
      })
    });
    if (!res.ok) throw new Error('Failed to exchange MeriPehchaan token');
    return res.json();
  },

  // Phase 15: Industrial Emissions & MPCB Compliance (MahaVayu)
  async getIndustrialStacks() {
    const res = await fetch(`${API_BASE}/industrial-emissions/industrial-stacks`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch industrial CEMS stacks');
    return res.json();
  },

  async issueIndustrialPenalty(stackId: string) {
    const res = await fetch(`${API_BASE}/industrial-emissions/issue-penalty`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ stack_id: stackId })
    });
    if (!res.ok) throw new Error('Failed to issue MPCB penalty notice');
    return res.json();
  },

  // Phase 15: Marriage e-Registry & Joint Entitlements (MahaBandhan)
  async getRecentMarriages() {
    const res = await fetch(`${API_BASE}/marriage-registry/recent-marriages`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch marriage registrations');
    return res.json();
  },

  async registerMarriage(payload: {
    spouse_one_name: string;
    spouse_one_aadhaar_vault?: string;
    spouse_two_name: string;
    spouse_two_aadhaar_vault?: string;
    marriage_venue: string;
    corporation: string;
  }) {
    const res = await fetch(`${API_BASE}/marriage-registry/register-marriage`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({
        spouse_one_aadhaar_vault: 'vault:uidai:981244510923',
        spouse_two_aadhaar_vault: 'vault:uidai:771209384512',
        ...payload
      })
    });
    if (!res.ok) throw new Error('Failed to register marriage');
    return res.json();
  },

  // Phase 15: Solar Agricultural Feeder Balancer (MahaVidyut)
  async getSolarFeeders() {
    const res = await fetch(`${API_BASE}/solar-feeder/feeders`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch solar feeders');
    return res.json();
  },

  async optimizeSolarFeeder(feederId: string) {
    const res = await fetch(`${API_BASE}/solar-feeder/optimize-feeder`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ feeder_id: feederId })
    });
    if (!res.ok) throw new Error('Failed to optimize solar feeder');
    return res.json();
  },

  // Phase 15: Policy SQL Copilot (MahaPrashna)
  async getSamplePolicyQueries() {
    const res = await fetch(`${API_BASE}/policy-copilot/sample-queries`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch sample policy queries');
    return res.json();
  },

  async askPolicyCopilot(question: string) {
    const res = await fetch(`${API_BASE}/policy-copilot/ask`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ question })
    });
    if (!res.ok) throw new Error('Failed to query policy copilot');
    return res.json();
  },

  // Phase 15: Master 15-Phase Hackathon Capstone (MahaSarvottam)
  async getMasterCapstoneOverview() {
    const res = await fetch(`${API_BASE}/master-showcase/state-overview`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch master capstone overview');
    return res.json();
  },

  async runFullSpectrumSimulation() {
    const res = await fetch(`${API_BASE}/master-showcase/run-full-spectrum`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error('Failed to run full spectrum simulation');
    return res.json();
  },

  // In-App Notifications
  async getNotifications(): Promise<InAppNotification[]> {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<InAppNotification> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  async markAllNotificationsRead(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
    return res.json();
  },

  // AI Assistant (MahaSetu Mitra)
  async sendChatMessage(message: string, conversation_id?: string): Promise<{ conversation_id: string; message: ChatMessage }> {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ message, conversation_id })
    });
    if (!res.ok) throw new Error('Failed to communicate with assistant');
    return res.json();
  },

  async getAssistantConversations(): Promise<ConversationSummary[]> {
    const res = await fetch(`${API_BASE}/assistant/conversations`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch assistant conversations');
    return res.json();
  },

  async getAssistantConversation(id: string): Promise<ConversationDetail> {
    const res = await fetch(`${API_BASE}/assistant/conversations/${id}`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to fetch conversation history');
    return res.json();
  },

  async getAssistantStatus(): Promise<{
    gemini_active: boolean;
    model: string;
    provider: string;
    grounding_enabled: boolean;
  }> {
    const res = await fetch(`${API_BASE}/assistant/status`);
    if (!res.ok) throw new Error('Failed to fetch assistant model status');
    return res.json();
  },

  // Phase 11: Citizen Smart Dashboard
  async getCitizenDashboardSummary(): Promise<any> {
    const res = await fetch(`${API_BASE}/applications/citizen-summary`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to load citizen dashboard summary');
    return res.json();
  },

  getApplicationLiveFeedUrl(): string {
    const token = localStorage.getItem('mahasetu_token') || '';
    return `${API_BASE}/applications/live-feed?token=${encodeURIComponent(token)}`;
  },

  // Phase 12: Enhanced Services Catalog
  async getServiceStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/services/stats`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to load service stats');
    return res.json();
  },

  async getServiceCategories(): Promise<any> {
    const res = await fetch(`${API_BASE}/services/categories`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to load service categories');
    return res.json();
  },

  // Phase 13: Platform Landing Stats (public — no auth needed)
  async getPlatformStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/platform/stats`);
    if (!res.ok) throw new Error('Failed to load platform stats');
    return res.json();
  },

  async getPlatformArchitecture(): Promise<any> {
    const res = await fetch(`${API_BASE}/platform/architecture`);
    if (!res.ok) throw new Error('Failed to load architecture');
    return res.json();
  },

  // Phase 15: Governance Analytics
  async getGovernanceAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/dashboard/analytics`, { headers: getAuthHeader() });
    if (!res.ok) throw new Error('Failed to load governance analytics');
    return res.json();
  },
};


