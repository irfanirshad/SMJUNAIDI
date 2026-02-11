// Role-based permissions for mobile app

export interface RolePermission {
  canAccessOrders: boolean;
  canAccessProducts: boolean;
  canAccessUsers: boolean;
  canAccessReviews: boolean;
  canAccessAnalytics: boolean;
  canUpdateOrderStatus: boolean;
  canDeleteOrders: boolean;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  availableOrderStatuses: string[];
  highlightOrderStatuses: string[];
}

export const getRolePermissions = (
  role: string,
  employeeRole?: string | null,
): RolePermission => {
  // Admin has full access
  if (role === 'admin') {
    return {
      canAccessOrders: true,
      canAccessProducts: true,
      canAccessUsers: true,
      canAccessReviews: true,
      canAccessAnalytics: true,
      canUpdateOrderStatus: true,
      canDeleteOrders: true,
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canCreateUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      availableOrderStatuses: [
        'pending',
        'payment_done',
        'packed',
        'delivering',
        'delivered',
        'completed',
        'cancelled',
      ],
      highlightOrderStatuses: ['pending', 'payment_done'],
    };
  }

  // Employee permissions based on employee_role
  if (role === 'employee') {
    switch (employeeRole) {
      case 'call_center':
        return {
          canAccessOrders: true,
          canAccessProducts: false,
          canAccessUsers: false,
          canAccessReviews: false,
          canAccessAnalytics: false,
          canUpdateOrderStatus: true,
          canDeleteOrders: false,
          canCreateProducts: false,
          canEditProducts: false,
          canDeleteProducts: false,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          availableOrderStatuses: ['pending', 'payment_done'],
          highlightOrderStatuses: ['pending', 'payment_done'],
        };

      case 'packer':
        return {
          canAccessOrders: true,
          canAccessProducts: true, // Can view products for packing
          canAccessUsers: false,
          canAccessReviews: false,
          canAccessAnalytics: false,
          canUpdateOrderStatus: true,
          canDeleteOrders: false,
          canCreateProducts: false,
          canEditProducts: false, // Can only view
          canDeleteProducts: false,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          availableOrderStatuses: ['payment_done', 'packed'],
          highlightOrderStatuses: ['payment_done'],
        };

      case 'deliveryman':
        return {
          canAccessOrders: true,
          canAccessProducts: false,
          canAccessUsers: false,
          canAccessReviews: false,
          canAccessAnalytics: false,
          canUpdateOrderStatus: true,
          canDeleteOrders: false,
          canCreateProducts: false,
          canEditProducts: false,
          canDeleteProducts: false,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          availableOrderStatuses: ['packed', 'delivering', 'delivered'],
          highlightOrderStatuses: ['packed', 'delivering'],
        };

      case 'accounts':
        return {
          canAccessOrders: true,
          canAccessProducts: false,
          canAccessUsers: false,
          canAccessReviews: false,
          canAccessAnalytics: false,
          canUpdateOrderStatus: true,
          canDeleteOrders: false,
          canCreateProducts: false,
          canEditProducts: false,
          canDeleteProducts: false,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          availableOrderStatuses: ['delivered', 'completed'],
          highlightOrderStatuses: ['delivered'],
        };

      case 'incharge':
        return {
          canAccessOrders: true,
          canAccessProducts: true,
          canAccessUsers: false,
          canAccessReviews: false,
          canAccessAnalytics: true,
          canUpdateOrderStatus: true,
          canDeleteOrders: false,
          canCreateProducts: false,
          canEditProducts: true,
          canDeleteProducts: false,
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          availableOrderStatuses: [
            'pending',
            'payment_done',
            'packed',
            'delivering',
            'delivered',
            'completed',
            'cancelled',
          ],
          highlightOrderStatuses: [
            'pending',
            'payment_done',
            'packed',
          ],
        };

      default:
        // No permissions for unknown employee role
        return getNoPermissions();
    }
  }

  // Regular user - no admin/employee permissions
  return getNoPermissions();
};

const getNoPermissions = (): RolePermission => ({
  canAccessOrders: false,
  canAccessProducts: false,
  canAccessUsers: false,
  canAccessReviews: false,
  canAccessAnalytics: false,
  canUpdateOrderStatus: false,
  canDeleteOrders: false,
  canCreateProducts: false,
  canEditProducts: false,
  canDeleteProducts: false,
  canCreateUsers: false,
  canEditUsers: false,
  canDeleteUsers: false,
  availableOrderStatuses: [],
  highlightOrderStatuses: [],
});

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'Pending',
    payment_done: 'Payment Done',
    // Legacy statuses mapped to new wording for old orders
    address_confirmed: 'Payment Done',
    confirmed: 'Payment Done',
    packed: 'Packed',
    delivering: 'Delivering',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return labels[status] || status;
};

export const getRoleDashboardMessage = (
  role: string,
  employeeRole?: string | null,
): { title: string; description: string } => {
  if (role === 'admin') {
    return {
      title: 'Admin Dashboard',
      description: 'Manage all aspects of your store',
    };
  }

  if (role === 'employee') {
    switch (employeeRole) {
      case 'call_center':
        return {
          title: 'Call Center',
          description: 'Confirm addresses and prepare orders',
        };
      case 'packer':
        return {
          title: 'Packer',
          description: 'Pack orders for delivery',
        };
      case 'deliveryman':
        return {
          title: 'Delivery',
          description: 'Deliver orders and collect payments',
        };
      case 'accounts':
        return {
          title: 'Accounts',
          description: 'Complete orders and manage finances',
        };
      case 'incharge':
        return {
          title: 'Incharge',
          description: 'Oversee operations and team',
        };
      default:
        return {
          title: 'Employee Dashboard',
          description: 'Welcome to your workspace',
        };
    }
  }

  return {
    title: 'Dashboard',
    description: 'Welcome',
  };
};

export const getEmployeeRoleColor = (employeeRole: string): string => {
  const colors: Record<string, string> = {
    call_center: '#3b82f6',
    packer: '#10b981',
    deliveryman: '#f59e0b',
    accounts: '#8b5cf6',
    incharge: '#ef4444',
  };

  return colors[employeeRole] || '#6b7280';
};
