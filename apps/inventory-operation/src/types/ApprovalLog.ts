// Approval Log types for tracking approval workflow and audit trail

export interface ApprovalLog {
  id: string;
  
  // Reference to the item being approved
  entityType: ApprovalEntityType;
  entityId: string;
  
  // Approval details
  action: ApprovalAction;
  status: ApprovalStatus;
  
  // People involved
  requestedBy: string; // User ID who initiated the request
  approvedBy?: string; // User ID who approved/rejected
  
  // Timing
  requestedAt: Date;
  processedAt?: Date; // When approved/rejected
  
  // Details
  reason?: string; // Reason for the request
  comments?: string; // Approval/rejection comments
  attachments?: string[]; // File attachments if any
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export enum ApprovalEntityType {
  SPECIAL_OUTBOUND = 'special_outbound',
  INVENTORY_ADJUSTMENT = 'inventory_adjustment',
  PRODUCT_CATALOG_CHANGE = 'product_catalog_change',
  USER_ROLE_CHANGE = 'user_role_change',
}

export enum ApprovalAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  CANCEL = 'cancel',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

// Approval workflow configuration
export interface ApprovalWorkflow {
  id: string;
  entityType: ApprovalEntityType;
  name: string;
  description?: string;
  
  // Workflow steps
  steps: ApprovalStep[];
  
  // Configuration
  isActive: boolean;
  autoExpireHours?: number; // Auto-expire pending approvals after X hours
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalStep {
  stepOrder: number;
  name: string;
  description?: string;
  
  // Who can approve at this step
  approverRoles: string[]; // User roles that can approve
  approverUsers?: string[]; // Specific users that can approve
  
  // Requirements
  isRequired: boolean;
  requiresAllApprovers: boolean; // If true, all approvers must approve
  
  // Conditions
  conditions?: ApprovalCondition[];
}

export interface ApprovalCondition {
  field: string; // Field to check (e.g., 'quantity', 'amount')
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  value: any;
  description?: string;
}

// Approval summary for dashboard/reports
export interface ApprovalSummary {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalExpired: number;
  
  // By entity type
  byEntityType: Record<ApprovalEntityType, {
    pending: number;
    approved: number;
    rejected: number;
  }>;
  
  // Recent activity
  recentApprovals: ApprovalLog[];
  
  // User-specific
  myPendingApprovals: ApprovalLog[];
  myRequestsPending: ApprovalLog[];
}

// Notification data for approval events
export interface ApprovalNotification {
  id: string;
  approvalLogId: string;
  recipientUserId: string;
  
  type: ApprovalNotificationType;
  title: string;
  message: string;
  
  isRead: boolean;
  readAt?: Date;
  
  createdAt: Date;
}

export enum ApprovalNotificationType {
  APPROVAL_REQUESTED = 'approval_requested',
  APPROVAL_APPROVED = 'approval_approved',
  APPROVAL_REJECTED = 'approval_rejected',
  APPROVAL_EXPIRED = 'approval_expired',
  APPROVAL_CANCELLED = 'approval_cancelled',
}

// Helper functions
export const getApprovalStatusDisplayName = (status: ApprovalStatus): string => {
  const statusNames: Record<ApprovalStatus, string> = {
    [ApprovalStatus.PENDING]: 'Đang chờ duyệt',
    [ApprovalStatus.APPROVED]: 'Đã duyệt',
    [ApprovalStatus.REJECTED]: 'Từ chối',
    [ApprovalStatus.CANCELLED]: 'Đã hủy',
    [ApprovalStatus.EXPIRED]: 'Hết hạn',
  };
  return statusNames[status] || status;
};

export const getApprovalActionDisplayName = (action: ApprovalAction): string => {
  const actionNames: Record<ApprovalAction, string> = {
    [ApprovalAction.CREATE]: 'Tạo mới',
    [ApprovalAction.UPDATE]: 'Cập nhật',
    [ApprovalAction.DELETE]: 'Xóa',
    [ApprovalAction.APPROVE]: 'Duyệt',
    [ApprovalAction.REJECT]: 'Từ chối',
    [ApprovalAction.CANCEL]: 'Hủy',
  };
  return actionNames[action] || action;
};
