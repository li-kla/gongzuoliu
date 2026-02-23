import mongoose from 'mongoose';
import Activity from '../models/Activity';

interface ActivityData {
  userId: mongoose.Schema.Types.ObjectId;
  username: string;
  type: 'register' | 'vip_upgrade' | 'svip_upgrade' | 'workflow_download';
  action: string;
  workflowId?: mongoose.Schema.Types.ObjectId;
  workflowTitle?: string;
}

export const logActivity = async (data: ActivityData) => {
  try {
    const activity = new Activity({
      userId: data.userId,
      username: data.username,
      type: data.type,
      action: data.action,
      workflowId: data.workflowId,
      workflowTitle: data.workflowTitle,
      timestamp: new Date()
    });
    
    await activity.save();
    return activity;
  } catch (error) {
    console.error('记录活动失败:', error);
    return null;
  }
};

export const getRecentActivities = async (limit: number = 10) => {
  try {
    const activities = await Activity.find({})
      .sort({ timestamp: -1 })
      .limit(limit);
    
    return activities;
  } catch (error) {
    console.error('获取最近活动失败:', error);
    return [];
  }
};