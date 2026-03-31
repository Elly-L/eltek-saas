// Dummy data for organization management system
// This provides realistic data for three organizations with different datasets

export interface DataRecord {
  id: string
  name: string
  status: string
  value: number
  lastUpdated: string
}

export interface AdminDataRecord {
  id: string
  type: string
  organization: string
  count: number
  status: string
  updatedAt: string
}

// Eltek organization data
const ELTEK_DATA: DataRecord[] = [
  {
    id: 'eltek-001',
    name: 'Enterprise Security Suite',
    status: 'active',
    value: 15000,
    lastUpdated: '2025-03-28',
  },
  {
    id: 'eltek-002',
    name: 'Cloud Infrastructure',
    status: 'active',
    value: 25000,
    lastUpdated: '2025-03-29',
  },
  {
    id: 'eltek-003',
    name: 'Data Analytics Platform',
    status: 'maintenance',
    value: 12000,
    lastUpdated: '2025-03-15',
  },
]

// Acme Corp organization data
const ACME_DATA: DataRecord[] = [
  {
    id: 'acme-001',
    name: 'Project Alpha - Development',
    status: 'active',
    value: 45000,
    lastUpdated: '2025-03-30',
  },
  {
    id: 'acme-002',
    name: 'Marketing Automation',
    status: 'active',
    value: 22000,
    lastUpdated: '2025-03-29',
  },
  {
    id: 'acme-003',
    name: 'Customer Portal',
    status: 'active',
    value: 18000,
    lastUpdated: '2025-03-28',
  },
  {
    id: 'acme-004',
    name: 'Legacy System Migration',
    status: 'pending',
    value: 8000,
    lastUpdated: '2025-03-20',
  },
]

// Global Tech organization data
const GLOBAL_TECH_DATA: DataRecord[] = [
  {
    id: 'globaltech-001',
    name: 'AI/ML Research Initiative',
    status: 'active',
    value: 55000,
    lastUpdated: '2025-03-29',
  },
  {
    id: 'globaltech-002',
    name: 'Global Network Infrastructure',
    status: 'active',
    value: 120000,
    lastUpdated: '2025-03-30',
  },
  {
    id: 'globaltech-003',
    name: 'Quantum Computing Lab',
    status: 'research',
    value: 30000,
    lastUpdated: '2025-03-25',
  },
]

// Admin data for organizations
const ELTEK_ADMIN_DATA: AdminDataRecord[] = [
  {
    id: 'eltek-admin-001',
    type: 'Users',
    organization: 'Eltek',
    count: 24,
    status: 'active',
    updatedAt: '2025-03-30',
  },
  {
    id: 'eltek-admin-002',
    type: 'API Keys',
    organization: 'Eltek',
    count: 8,
    status: 'active',
    updatedAt: '2025-03-28',
  },
  {
    id: 'eltek-admin-003',
    type: 'Integrations',
    organization: 'Eltek',
    count: 5,
    status: 'active',
    updatedAt: '2025-03-27',
  },
  {
    id: 'eltek-admin-004',
    type: 'Audit Logs',
    organization: 'Eltek',
    count: 1247,
    status: 'archived',
    updatedAt: '2025-03-15',
  },
]

const ACME_ADMIN_DATA: AdminDataRecord[] = [
  {
    id: 'acme-admin-001',
    type: 'Users',
    organization: 'Acme Corp',
    count: 156,
    status: 'active',
    updatedAt: '2025-03-30',
  },
  {
    id: 'acme-admin-002',
    type: 'API Keys',
    organization: 'Acme Corp',
    count: 42,
    status: 'active',
    updatedAt: '2025-03-29',
  },
  {
    id: 'acme-admin-003',
    type: 'Integrations',
    organization: 'Acme Corp',
    count: 18,
    status: 'active',
    updatedAt: '2025-03-28',
  },
  {
    id: 'acme-admin-004',
    type: 'Teams',
    organization: 'Acme Corp',
    count: 12,
    status: 'active',
    updatedAt: '2025-03-30',
  },
  {
    id: 'acme-admin-005',
    type: 'Audit Logs',
    organization: 'Acme Corp',
    count: 8934,
    status: 'archived',
    updatedAt: '2025-03-15',
  },
]

const GLOBAL_TECH_ADMIN_DATA: AdminDataRecord[] = [
  {
    id: 'globaltech-admin-001',
    type: 'Users',
    organization: 'Global Tech',
    count: 342,
    status: 'active',
    updatedAt: '2025-03-30',
  },
  {
    id: 'globaltech-admin-002',
    type: 'API Keys',
    organization: 'Global Tech',
    count: 127,
    status: 'active',
    updatedAt: '2025-03-30',
  },
  {
    id: 'globaltech-admin-003',
    type: 'Integrations',
    organization: 'Global Tech',
    count: 43,
    status: 'active',
    updatedAt: '2025-03-29',
  },
  {
    id: 'globaltech-admin-004',
    type: 'Teams',
    organization: 'Global Tech',
    count: 28,
    status: 'active',
    updatedAt: '2025-03-30',
  },
  {
    id: 'globaltech-admin-005',
    type: 'Divisions',
    organization: 'Global Tech',
    count: 6,
    status: 'active',
    updatedAt: '2025-03-25',
  },
  {
    id: 'globaltech-admin-006',
    type: 'Audit Logs',
    organization: 'Global Tech',
    count: 45827,
    status: 'archived',
    updatedAt: '2025-03-15',
  },
]

// Get data by organization ID
export function getDataByOrg(orgId: string): DataRecord[] {
  switch (orgId) {
    case '366479630091241134': // Eltek
      return ELTEK_DATA
    case '366479832122410670': // Acme Corp
      return ACME_DATA
    case '366479851063887534': // Global Tech
      return GLOBAL_TECH_DATA
    default:
      return []
  }
}

// Get admin data by organization ID
export function getAdminDataByOrg(orgId: string): AdminDataRecord[] {
  switch (orgId) {
    case '366479630091241134': // Eltek
      return ELTEK_ADMIN_DATA
    case '366479832122410670': // Acme Corp
      return ACME_ADMIN_DATA
    case '366479851063887534': // Global Tech
      return GLOBAL_TECH_ADMIN_DATA
    default:
      return []
  }
}

// Get organization name by ID
export function getOrgName(orgId: string): string {
  switch (orgId) {
    case '1':
      return 'Eltek'
    case '2':
      return 'Acme Corp'
    case '3':
      return 'Global Tech'
    default:
      return 'Unknown Organization'
  }
}
