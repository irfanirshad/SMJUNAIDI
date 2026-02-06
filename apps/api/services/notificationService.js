import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";

class NotificationService {
  // Create a new notification
  async createNotification({
    userId,
    type,
    title,
    message,
    relatedOrderId = null,
    image = null,
    actionUrl = null,
    actionText = null,
    priority = "normal",
    senderId = null,
    isBulkSent = false,
    bulkSendId = null,
    targetAudience = "specific",
    metadata = {},
  }) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        relatedOrderId,
        image,
        actionUrl,
        actionText,
        priority,
        senderId,
        isBulkSent,
        bulkSendId,
        targetAudience,
        metadata,
      });


      return notification;
    } catch (error) {
      console.error("❌ Failed to create notification:", error);
      throw error;
    }
  }

  // Send bulk notifications to all users
  async sendBulkNotification({
    type,
    title,
    message,
    image = null,
    actionUrl = null,
    actionText = null,
    priority = "normal",
    senderId,
    userIds = null, // If null, send to all users
    targetAudience = "all",
  }) {
    try {
      const bulkSendId = `bulk_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Get target users
      let targetUsers;
      if (userIds && userIds.length > 0) {
        // Send to specific users
        targetUsers = await User.find({ _id: { $in: userIds } }).select("_id");
        targetAudience = "specific";
      } else {
        // Send to all users except admins and employees
        targetUsers = await User.find({
          role: { $nin: ["admin", "employee"] },
        }).select("_id");
      }

      // Create notification for each user
      const notifications = await Promise.all(
        targetUsers.map((user) =>
          this.createNotification({
            userId: user._id,
            type,
            title,
            message,
            image,
            actionUrl,
            actionText,
            priority,
            senderId,
            isBulkSent: true,
            bulkSendId,
            targetAudience,
          })
        )
      );


      return {
        success: true,
        count: notifications.length,
        bulkSendId,
        notifications: notifications.slice(0, 10), // Return first 10 as sample
      };
    } catch (error) {
      console.error("❌ Failed to send bulk notification:", error);
      throw error;
    }
  }

  // Get all bulk sends (for admin dashboard)
  async getBulkSends({ limit = 20, skip = 0 }) {
    try {
      const bulkSends = await Notification.aggregate([
        {
          $match: {
            isBulkSent: true,
          },
        },
        {
          $group: {
            _id: "$bulkSendId",
            type: { $first: "$type" },
            title: { $first: "$title" },
            message: { $first: "$message" },
            image: { $first: "$image" },
            priority: { $first: "$priority" },
            targetAudience: { $first: "$targetAudience" },
            senderId: { $first: "$senderId" },
            createdAt: { $first: "$createdAt" },
            totalSent: { $sum: 1 },
            readCount: {
              $sum: {
                $cond: ["$isRead", 1, 0],
              },
            },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);

      const total = await Notification.distinct("bulkSendId", {
        isBulkSent: true,
      });

      return {
        bulkSends,
        total: total.length,
      };
    } catch (error) {
      console.error("❌ Failed to get bulk sends:", error);
      throw error;
    }
  }

  // Create order placed notification
  async notifyOrderPlaced(userId, order) {
    return this.createNotification({
      userId,
      type: "order_placed",
      title: "Order Placed Successfully",
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} for $${order.total.toFixed(2)} has been placed successfully. We'll notify you when it's confirmed.`,
      relatedOrderId: order._id,
      metadata: {
        orderId: order._id,
        total: order.total,
        status: order.status,
      },
    });
  }

  // Create order confirmed notification
  async notifyOrderConfirmed(userId, order) {
    return this.createNotification({
      userId,
      type: "order_confirmed",
      title: "Order Confirmed",
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been confirmed and is being prepared for shipment.`,
      relatedOrderId: order._id,
      metadata: {
        orderId: order._id,
        status: order.status,
      },
    });
  }

  // Create order shipped notification
  async notifyOrderShipped(userId, order) {
    return this.createNotification({
      userId,
      type: "order_shipped",
      title: "Order Shipped",
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been shipped and is on its way to you!`,
      relatedOrderId: order._id,
      metadata: {
        orderId: order._id,
        status: order.status,
      },
    });
  }

  // Create order delivered notification
  async notifyOrderDelivered(userId, order) {
    return this.createNotification({
      userId,
      type: "order_delivered",
      title: "Order Delivered",
      message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been delivered. Thank you for shopping with us!`,
      relatedOrderId: order._id,
      metadata: {
        orderId: order._id,
        status: order.status,
      },
    });
  }

  // Create payment success notification
  async notifyPaymentSuccess(userId, order) {
    return this.createNotification({
      userId,
      type: "payment_success",
      title: "Payment Successful",
      message: `Your payment of $${order.total.toFixed(2)} for order #${order._id.toString().slice(-6).toUpperCase()} was successful.`,
      relatedOrderId: order._id,
      metadata: {
        orderId: order._id,
        amount: order.total,
      },
    });
  }

  // Get user notifications
  async getUserNotifications(
    userId,
    { limit = 20, skip = 0, unreadOnly = false }
  ) {
    const query = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    return notification;
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return result;
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    const result = await Notification.deleteOne({
      _id: notificationId,
      userId,
    });
    return result;
  }

  // Delete all notifications for a user
  async deleteAllNotifications(userId) {
    const result = await Notification.deleteMany({ userId });
    return result;
  }
}

export const notificationService = new NotificationService();
