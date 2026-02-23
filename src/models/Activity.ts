import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  username: string;
  type: 'register' | 'vip_upgrade' | 'svip_upgrade' | 'workflow_download';
  action: string;
  workflowId?: mongoose.Schema.Types.ObjectId;
  workflowTitle?: string;
  timestamp: Date;
}

const ActivitySchema: Schema<IActivity> = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['register', 'vip_upgrade', 'svip_upgrade', 'workflow_download'],
    required: true
  },
  action: {
    type: String,
    required: true
  },
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  },
  workflowTitle: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Activity = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;