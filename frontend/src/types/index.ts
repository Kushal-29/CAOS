export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  avatarUrl?: string | null;
  joiningDate?: string | null;
  performanceScore?: number;
}

export type ClientStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'ARCHIVED';

export type ClientType =
  | 'INDIVIDUAL' | 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'LLP'
  | 'PRIVATE_LIMITED' | 'PUBLIC_LIMITED' | 'HUF' | 'TRUST' | 'OTHER';

export type GstStatus = 'ACTIVE' | 'CANCELLED' | 'SUSPENDED';
export type GstFilingFrequency = 'MONTHLY' | 'QUARTERLY';
export type GstReturnType = 'GSTR1' | 'GSTR3B' | 'CMP08' | 'GSTR9';
export type GstFilingStatus = 'PENDING' | 'IN_PROGRESS' | 'FILED' | 'LATE_FILED' | 'OVERDUE';

export type ItrType = 'ITR1' | 'ITR2' | 'ITR3' | 'ITR4' | 'ITR5' | 'ITR6' | 'ITR7';
export type ItrFilingStatus = 'PENDING' | 'DOCUMENTS_AWAITED' | 'READY_FOR_FILING' | 'IN_PROGRESS' | 'FILED' | 'VERIFIED' | 'REJECTED' | 'OVERDUE';
export type RefundStatus = 'N_A' | 'PROCESSED' | 'PENDING_ISSUANCE' | 'ISSUED' | 'REJECTED';
export type NoticeStatus = 'NO_NOTICE' | 'NOTICE_ISSUED' | 'RESPONDED' | 'RESOLVED';

export type Department = 'GST' | 'ITR' | 'TDS' | 'ROC' | 'AUDIT' | 'ADMIN';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'WAITING_FOR_CLIENT' | 'REVIEW' | 'COMPLETED' | 'OVERDUE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DocumentCategory =
  | 'PAN' | 'AADHAAR' | 'GST_CERTIFICATE' | 'FORM_16' | 'ITR_RETURNS'
  | 'AUDIT_REPORTS' | 'BANK_STATEMENTS' | 'AGREEMENTS' | 'TAX_RETURN' | 'NOTICE'
  | 'TDS' | 'BANK' | 'AUDIT' | 'ROC' | 'OTHER';

export type CredentialType = 'GST' | 'INCOME_TAX' | 'MCA' | 'TRACES' | 'OTHER';
export type NoteCategory = 'INTERNAL' | 'FOLLOWUP' | 'MEETING' | 'GENERAL';
export type FollowUpCategory = 'DOCUMENTS' | 'GST' | 'ITR' | 'AUDIT' | 'PAYMENT' | 'OTHER';
export type FollowUpStatus = 'OPEN' | 'RESOLVED' | 'CANCELLED';

export type ServiceType = 'ITR_FILING' | 'GST_FILING' | 'AUDIT' | 'BOOKKEEPING' | 'CONSULTATION' | 'ROC_COMPLIANCE' | 'OTHER';
export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export type FilingType = 'GST' | 'ITR' | 'TDS' | 'ROC' | 'AUDIT' | 'CONSULTATION';
export type FilingStatus = 'PENDING' | 'IN_PROGRESS' | 'WAITING_FOR_CLIENT' | 'REVIEW' | 'COMPLETED' | 'OVERDUE';

export interface Filing {
  id: string;
  type: FilingType;
  period: string;
  status: FilingStatus;
  dueDate: string;
  client: { id: string; name: string; clientCode: string };
}

export interface GstReturn {
  id: string;
  period: string;
  returnType: GstReturnType;
  status: GstFilingStatus;
  dueDate: string;
  filedDate?: string | null;
  ackNumber?: string | null;
  notes?: string | null;
  client?: {
    id: string;
    name: string;
    clientCode: string;
    gstin?: string | null;
    gstUsername?: string | null;
    gstFilingFrequency?: string | null;
    credentials?: Array<{ id: string; portalUsername: string }>;
  };
}

export interface ItrReturn {
  id: string;
  assessmentYear?: string;
  filingStatus?: ItrFilingStatus;
  refundStatus?: RefundStatus;
  noticeStatus?: NoticeStatus;
  acknowledgementNo?: string | null;
  filedDate?: string | null;
  dueDate?: string;
  notes?: string | null;
  password?: string | null;
  price?: number;
  isReceived?: boolean;
  assignedTo?: string | null;
  createdAt?: string;
  client?: { id: string; name: string; clientCode: string; panNumber?: string | null; itPasswordHash?: string | null };
}

export interface Note {
  id: string;
  category: NoteCategory;
  body: string;
  createdAt: string;
  author: { name: string };
}

export interface DocumentItem {
  id: string;
  category: DocumentCategory;
  folder: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  version?: number;
  parentDocId?: string | null;
  createdAt: string;
  client?: { id: string; name: string; clientCode: string };
  uploadedBy?: { name: string };
}

export interface CredentialItem {
  id: string;
  type: CredentialType;
  portalUsername: string;
  encryptedSecret?: string;
  lastRotatedAt?: string | null;
  updatedAt: string;
  lastViewedBy?: { name: string } | null;
  lastUpdatedBy?: { name: string } | null;
  client?: { id: string; name: string; clientCode: string };
}

export interface FollowUpItem {
  id: string;
  category: FollowUpCategory;
  title: string;
  notes?: string | null;
  dueDate: string;
  status: FollowUpStatus;
  client: { id: string; name: string; clientCode: string; mobile: string; email?: string | null };
  assignedTo?: { id: string; name: string } | null;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  serviceType: ServiceType;
  clientFee: number;
  paidAmount: number;
  pendingAmount: number;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  notes?: string | null;
  client: { id: string; name: string; clientCode: string; mobile: string };
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  joiningDate?: string | null;
  performanceScore?: number;
  isActive: boolean;
  assignedClientsCount: number;
  totalTasksCount: number;
  pendingTasksCount: number;
  completedTasksCount: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  department?: Department;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  client?: { id: string; name: string; clientCode: string } | null;
  assignee?: { id: string; name: string; avatarUrl?: string | null } | null;
  _count?: { comments: number; attachments: number };
}

export interface ActivityItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
  user?: { name: string } | null;
  metadata?: any;
}

export interface NoticeAnalysis {
  id: string;
  noticeType: string;
  taxAuthority: string;
  assessmentYear: string;
  demandAmount?: number;
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'ANALYZED' | 'ACTIONED';
  createdAt: string;
  client?: { id: string; name: string; clientCode: string };
}

export interface Client {
  id: string;
  clientCode: string;
  name: string;
  mobile: string;
  alternateMobile?: string | null;
  email?: string | null;
  address?: string | null;
  state?: string | null;
  dob?: string | null;
  panNumber?: string | null;
  aadhaar?: string | null;
  entityType?: ClientType;
  clientType: ClientType;
  businessType?: string | null;
  gstin?: string | null;
  tan?: string | null;
  cin?: string | null;
  businessAddress?: string | null;
  status?: ClientStatus;
  isGstClient: boolean;
  isItrClient: boolean;
  isActive: boolean;
  gstUsername?: string | null;
  gstRegistrationDate?: string | null;
  gstStatus?: GstStatus;
  gstFilingFrequency?: GstFilingFrequency | null;
  itUsername?: string | null;
  itrType?: ItrType;
  lastFiledAy?: string | null;
  lastFiledDate?: string | null;
  assessmentYear?: string | null;
  manager?: { id: string; name: string; email?: string } | null;
  assignedEmployee?: { id: string; name: string; email?: string } | null;
  createdAt: string;
  notes?: Note[];
  documents?: DocumentItem[];
  gstReturns?: GstReturn[];
  itrReturns?: ItrReturn[];
  tasks?: Task[];
  followUps?: FollowUpItem[];
  invoices?: InvoiceItem[];
  credentials?: CredentialItem[];
  activityLogs?: ActivityItem[];
}

export interface DashboardData {
  kpis: {
    totalClients: number;
    activeClients: number;
    gstClientsCount: number;
    itrClientsCount: number;
    gstPendingCount: number;
    itrPendingCount: number;
    tasksPendingCount: number;
    overdueTasksCount: number;
    documentsCount: number;
    followUpsOpenCount: number;
    totalRevenue: number;
    collectedRevenue: number;
    outstandingRevenue: number;
  };
  upcomingDeadlines: any[];
  tasksByStatus: { status: TaskStatus; count: number }[];
  productivity: { userId: string; name: string; completedTasks: number }[];
}
