const Notification = require("../models/Notification");

/**
 * Handles GET /notifications.
 * Retrieves all active in-app notifications for the logged-in user.
 */
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully.",
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /notifications/:id/read.
 * Marks a notification as read for the logged-in recipient.
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
        errors: [],
      });
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read successfully.",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
};
