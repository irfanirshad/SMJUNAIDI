import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { adminAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  getRolePermissions,
  getEmployeeRoleColor,
} from '../utils/rolePermissions';
import CommonNavbar from '../components/common/CommonNavbar';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  PlusSignIcon,
  Edit02Icon,
  Delete02Icon,
  Cancel01Icon,
  UserIcon,
  MailIcon,
  Call02Icon,
} from '@hugeicons/core-free-icons';

const colors = {
  primaryText: '#1a1a1a',
  secondaryText: '#666',
  babyshopSky: '#7dd3fc',
  white: '#fff',
  border: '#e0e0e0',
  background: '#f5f5f5',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  admin: '#8b5cf6',
  employee: '#3b82f6',
};

type UserManagementScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserManagement'
>;

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'employee' | 'customer';
  employee_role?:
    | 'call_center'
    | 'packer'
    | 'deliveryman'
    | 'accounts'
    | 'incharge';
  createdAt: Date | string;
  isActive?: boolean;
}

export default function UserManagementScreen() {
  const navigation = useNavigation<UserManagementScreenNavigationProp>();
  const { user } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Get permissions
  const permissions = getRolePermissions(user?.role || '', user?.employee_role);

  // Check if user has access (admin only)
  useEffect(() => {
    if (!permissions.canAccessUsers) {
      Alert.alert('Access Denied', 'You do not have access to this section.');
      navigation.goBack();
    }
  }, [permissions, navigation]);

  // Load users
  const loadUsers = useCallback(
    async (page = 1, refresh = false) => {
      if (!user?.token) return;

      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const filters: any = {};
        if (selectedRole !== 'all') {
          filters.role = selectedRole;
        }
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        const response = await adminAPI.getAllUsers(
          user.token,
          page,
          20,
          filters,
        );

        if (refresh) {
          setUsers(response.users);
        } else if (page === 1) {
          setUsers(response.users);
        } else {
          setUsers(prev => [...prev, ...response.users]);
        }

        setHasMore(response.hasMore);
        setCurrentPage(page);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load users');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.token, selectedRole, searchQuery],
  );

  // Initial load
  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers(1);
  };

  const handleRefresh = () => {
    loadUsers(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadUsers(currentPage + 1);
    }
  };

  const handleFilterApply = (role: string) => {
    setSelectedRole(role);
    setShowFilterModal(false);
    setCurrentPage(1);
    loadUsers(1);
  };

  const handleAddUser = () => {
    if (!permissions.canCreateUsers) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to create users.',
      );
      return;
    }
    // Navigate to add user screen (to be created)
    Alert.alert('Coming Soon', 'Add user feature will be implemented soon.');
  };

  const handleEditUser = (userId: string) => {
    if (!permissions.canEditUsers) {
      Alert.alert('Access Denied', 'You do not have permission to edit users.');
      return;
    }
    // Navigate to edit user screen (to be created)
    Alert.alert(
      'Coming Soon',
      `Edit user ${userId} feature will be implemented soon.`,
    );
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!permissions.canDeleteUsers) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to delete users.',
      );
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete "${userName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.token) return;

            try {
              setIsLoading(true);
              await adminAPI.deleteUser(user.token, userId);
              Alert.alert('Success', 'User deleted successfully');
              handleRefresh();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete user');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const getRoleBadgeColor = (role: string, employeeRole?: string) => {
    if (role === 'admin') return colors.admin;
    if (role === 'employee' && employeeRole) {
      return getEmployeeRoleColor(employeeRole);
    }
    return colors.secondaryText;
  };

  const getRoleLabel = (role: string, employeeRole?: string) => {
    if (role === 'admin') return 'Admin';
    if (role === 'employee' && employeeRole) {
      switch (employeeRole) {
        case 'call_center':
          return 'Call Center';
        case 'packer':
          return 'Packer';
        case 'deliveryman':
          return 'Delivery';
        case 'accounts':
          return 'Accounts';
        case 'incharge':
          return 'Incharge';
        default:
          return 'Employee';
      }
    }
    return 'Customer';
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Render user item
  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => {
        // Navigate to user details (to be created)
        Alert.alert('User Details', `View details for ${item.name}`);
      }}
    >
      <View style={styles.userAvatar}>
        <HugeiconsIcon icon={UserIcon} size={28} color={colors.white} />
      </View>

      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: getRoleBadgeColor(
                  item.role,
                  item.employee_role,
                ),
              },
            ]}
          >
            <Text style={styles.roleBadgeText}>
              {getRoleLabel(item.role, item.employee_role)}
            </Text>
          </View>
        </View>

        <View style={styles.userContact}>
          <HugeiconsIcon
            icon={MailIcon}
            size={14}
            color={colors.secondaryText}
          />
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        {item.phone && (
          <View style={styles.userContact}>
            <HugeiconsIcon
              icon={Call02Icon}
              size={14}
              color={colors.secondaryText}
            />
            <Text style={styles.userPhone}>{item.phone}</Text>
          </View>
        )}

        <View style={styles.userFooter}>
          <Text style={styles.userJoinDate}>
            Joined {formatDate(item.createdAt)}
          </Text>
          {item.isActive !== undefined && (
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: item.isActive
                    ? colors.success
                    : colors.error,
                },
              ]}
            />
          )}
        </View>
      </View>

      <View style={styles.userActions}>
        {permissions.canEditUsers && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditUser(item._id)}
          >
            <HugeiconsIcon
              icon={Edit02Icon}
              size={20}
              color={colors.babyshopSky}
            />
          </TouchableOpacity>
        )}

        {permissions.canDeleteUsers && item._id !== user?._id && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteUser(item._id, item.name)}
          >
            <HugeiconsIcon icon={Delete02Icon} size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CommonNavbar
        title="User Management"
        showBackButton={true}
        showIcons={{
          cart: false,
          orders: false,
          wishlist: false,
          profile: true,
        }}
      />

      {/* Search and Actions */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <HugeiconsIcon
            icon={SearchIcon}
            size={20}
            color={colors.secondaryText}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <HugeiconsIcon icon={FilterIcon} size={20} color="#fff" />
          {selectedRole !== 'all' && <View style={styles.filterBadge} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <HugeiconsIcon icon={RefreshIcon} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Add User Button */}
      {permissions.canCreateUsers && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
          <HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add New User</Text>
        </TouchableOpacity>
      )}

      {/* Users List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.babyshopSky} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <HugeiconsIcon
            icon={UserIcon}
            size={64}
            color={colors.secondaryText}
          />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your search or filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading && !isRefreshing ? (
              <ActivityIndicator
                size="small"
                color={colors.babyshopSky}
                style={styles.loadingFooter}
              />
            ) : null
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Users</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={24}
                  color={colors.primaryText}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.filterLabel}>User Role</Text>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedRole === 'all' && styles.filterOptionSelected,
                ]}
                onPress={() => handleFilterApply('all')}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedRole === 'all' && styles.filterOptionTextSelected,
                  ]}
                >
                  All Users
                </Text>
              </TouchableOpacity>

              {['admin', 'employee', 'customer'].map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.filterOption,
                    selectedRole === role && styles.filterOptionSelected,
                  ]}
                  onPress={() => handleFilterApply(role)}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          role === 'admin'
                            ? colors.admin
                            : role === 'employee'
                            ? colors.employee
                            : colors.secondaryText,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedRole === role && styles.filterOptionTextSelected,
                    ]}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}s
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: colors.white,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.primaryText,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.babyshopSky,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: colors.error,
    borderRadius: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.babyshopSky,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.babyshopSky,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 6,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  userContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userEmail: {
    flex: 1,
    fontSize: 13,
    color: colors.secondaryText,
  },
  userPhone: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  userJoinDate: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  userActions: {
    gap: 8,
    justifyContent: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  modalBody: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.background,
    gap: 10,
  },
  filterOptionSelected: {
    backgroundColor: colors.babyshopSky,
  },
  filterOptionText: {
    fontSize: 15,
    color: colors.primaryText,
  },
  filterOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
