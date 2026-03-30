import { ORGANIZATIONS } from './auth-config'

// In-memory data store keyed by organization ID
// In production, replace with actual database
interface DataRecord {
  id: string
  title: string
  content: string
  createdAt: string
  orgId: string
}

interface AdminRecord {
  id: string
  action: string
  target: string
  performedAt: string
  orgId: string
}

// Initialize with sample data for each organization
const dataStore: Record<string, DataRecord[]> = {
  [ORGANIZATIONS.eltek.id]: [
    {
      id: '1',
      title: 'Eltek Project Alpha',
      content: 'Main development initiative for Q1',
      createdAt: new Date().toISOString(),
      orgId: ORGANIZATIONS.eltek.id,
    },
    {
      id: '2',
      title: 'Eltek Infrastructure Update',
      content: 'Cloud migration planning document',
      createdAt: new Date().toISOString(),
      orgId: ORGANIZATIONS.eltek.id,
    },
  ],
  [ORGANIZATIONS.acme.id]: [
    {
      id: '1',
      title: 'Acme Product Launch',
      content: 'New product line release schedule',
      createdAt: new Date().toISOString(),
      orgId: ORGANIZATIONS.acme.id,
    },
    {
      id: '2',
      title: 'Acme Marketing Campaign',
      content: 'Q2 marketing strategy overview',
      createdAt: new Date().toISOString(),
      orgId: ORGANIZATIONS.acme.id,
    },
  ],
  [ORGANIZATIONS.global.id]: [
    {
      id: '1',
      title: 'Global Tech Expansion',
      content: 'International market entry plan',
      createdAt: new Date().toISOString(),
      orgId: ORGANIZATIONS.global.id,
    },
    {
      id: '2',
      title: 'Global Tech R&D',
      content: 'Research initiatives for next year',
      createdAt: new Date().toISOString(),
      orgId: ORGANIZATIONS.global.id,
    },
  ],
}

const adminStore: Record<string, AdminRecord[]> = {
  [ORGANIZATIONS.eltek.id]: [
    {
      id: '1',
      action: 'User Created',
      target: 'john.doe@eltek.com',
      performedAt: new Date().toISOString(),
      orgId: ORGANIZATIONS.eltek.id,
    },
  ],
  [ORGANIZATIONS.acme.id]: [
    {
      id: '1',
      action: 'Role Changed',
      target: 'admin@acme.com',
      performedAt: new Date().toISOString(),
      orgId: ORGANIZATIONS.acme.id,
    },
    {
      id: '2',
      action: 'User Deleted',
      target: 'former@acme.com',
      performedAt: new Date().toISOString(),
      orgId: ORGANIZATIONS.acme.id,
    },
  ],
  [ORGANIZATIONS.global.id]: [
    {
      id: '1',
      action: 'Settings Updated',
      target: 'Global Tech Settings',
      performedAt: new Date().toISOString(),
      orgId: ORGANIZATIONS.global.id,
    },
  ],
}

export function getDataByOrg(orgId: string): DataRecord[] {
  return dataStore[orgId] || []
}

export function getAdminDataByOrg(orgId: string): AdminRecord[] {
  return adminStore[orgId] || []
}

export function addData(orgId: string, data: Omit<DataRecord, 'id' | 'createdAt' | 'orgId'>): DataRecord {
  if (!dataStore[orgId]) {
    dataStore[orgId] = []
  }
  
  const newRecord: DataRecord = {
    ...data,
    id: String(dataStore[orgId].length + 1),
    createdAt: new Date().toISOString(),
    orgId,
  }
  
  dataStore[orgId].push(newRecord)
  return newRecord
}

export function addAdminData(orgId: string, data: Omit<AdminRecord, 'id' | 'performedAt' | 'orgId'>): AdminRecord {
  if (!adminStore[orgId]) {
    adminStore[orgId] = []
  }
  
  const newRecord: AdminRecord = {
    ...data,
    id: String(adminStore[orgId].length + 1),
    performedAt: new Date().toISOString(),
    orgId,
  }
  
  adminStore[orgId].push(newRecord)
  return newRecord
}
