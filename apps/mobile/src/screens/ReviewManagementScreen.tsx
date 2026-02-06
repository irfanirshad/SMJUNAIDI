import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { reviewAPI } from '../services/api';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { StarIcon, Tick02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

interface Review {
  productId: string;
  productName: string;
  reviewId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const ReviewManagementScreen: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingReviewId, setProcessingReviewId] = useState<string | null>(
    null,
  );

  const loadPendingReviews = useCallback(async () => {
    if (!user?.token) return;

    try {
      setIsLoading(true);
      const response = await reviewAPI.getPendingReviews(user.token);

      if (response.success) {
        setReviews(response.reviews || []);
      }
    } catch (error: any) {
      console.error('Failed to load reviews:', error);
      Alert.alert('Error', 'Failed to load pending reviews');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.token]);

  const handleApprove = async (productId: string, reviewId: string) => {
    if (!user?.token) return;

    Alert.alert(
      'Approve Review',
      'Are you sure you want to approve this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingReviewId(reviewId);
              const response = await reviewAPI.approveReview(
                user.token,
                productId,
                reviewId,
                true,
              );

              if (response.success) {
                Alert.alert('Success', 'Review approved successfully');
                loadPendingReviews();
              } else {
                Alert.alert('Error', response.message);
              }
            } catch (error: any) {
              Alert.alert('Error', 'Failed to approve review');
            } finally {
              setProcessingReviewId(null);
            }
          },
        },
      ],
    );
  };

  const handleReject = async (productId: string, reviewId: string) => {
    if (!user?.token) return;

    Alert.alert(
      'Reject Review',
      'Are you sure you want to reject and delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingReviewId(reviewId);
              const response = await reviewAPI.approveReview(
                user.token,
                productId,
                reviewId,
                false,
              );

              if (response.success) {
                Alert.alert('Success', 'Review rejected and deleted');
                loadPendingReviews();
              } else {
                Alert.alert('Error', response.message);
              }
            } catch (error: any) {
              Alert.alert('Error', 'Failed to reject review');
            } finally {
              setProcessingReviewId(null);
            }
          },
        },
      ],
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPendingReviews();
  };

  useEffect(() => {
    loadPendingReviews();
  }, [loadPendingReviews]);

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <HugeiconsIcon
            key={star}
            icon={StarIcon}
            size={16}
            color={star <= rating ? '#fbbf24' : '#d1d5db'}
          />
        ))}
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => {
    const isProcessing = processingReviewId === item.reviewId;

    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewHeaderLeft}>
            <Text style={styles.productName}>{item.productName}</Text>
            {renderStars(item.rating)}
          </View>
        </View>

        <View style={styles.reviewUser}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.reviewDate}>
            {new Date(item.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>

        <Text style={styles.reviewComment}>{item.comment}</Text>

        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.productId, item.reviewId)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <>
                <HugeiconsIcon icon={Cancel01Icon} size={18} color="#ef4444" />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item.productId, item.reviewId)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <HugeiconsIcon icon={Tick02Icon} size={18} color="#fff" />
                <Text style={styles.approveButtonText}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CommonNavbar
        title="Review Management"
        showBackButton={true}
        showIcons={{
          cart: false,
          orders: false,
          wishlist: false,
          profile: false,
        }}
      />

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.babyshopSky} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <HugeiconsIcon
            icon={StarIcon}
            size={64}
            color={colors.secondaryText}
          />
          <Text style={styles.emptyText}>No Pending Reviews</Text>
          <Text style={styles.emptySubtext}>
            All reviews have been processed
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={item => item.reviewId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.secondaryText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
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
  listContent: {
    padding: 16,
  },
  reviewCard: {
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewHeaderLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: 6,
  },
  reviewUser: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primaryText,
  },
  reviewDate: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.primaryText,
    lineHeight: 20,
    marginBottom: 16,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#fee2e2',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  approveButton: {
    backgroundColor: colors.babyshopSky,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ReviewManagementScreen;
