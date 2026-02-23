import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  siteDescription: string;
  siteLogo: string;
  siteFavicon: string;
  enableRegistration: boolean;
  enableEmailVerification: boolean;
  maxFileSize: number;
  allowedExtensions: string;
  uploadPath: string;
  enableFileCompression: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpFrom: string;
  enableEmailNotifications: boolean;
  updatedAt: Date;
}

const SettingsSchema: Schema<ISettings> = new Schema({
  siteName: {
    type: String,
    default: '视频工作流商城',
  },
  siteDescription: {
    type: String,
    default: '专业的视频工作流下载平台',
  },
  siteLogo: {
    type: String,
    default: '',
  },
  siteFavicon: {
    type: String,
    default: '',
  },
  enableRegistration: {
    type: Boolean,
    default: true,
  },
  enableEmailVerification: {
    type: Boolean,
    default: false,
  },
  maxFileSize: {
    type: Number,
    default: 50,
  },
  allowedExtensions: {
    type: String,
    default: '.zip,.rar,.7z',
  },
  uploadPath: {
    type: String,
    default: './uploads',
  },
  enableFileCompression: {
    type: Boolean,
    default: false,
  },
  smtpHost: {
    type: String,
    default: 'smtp.example.com',
  },
  smtpPort: {
    type: Number,
    default: 587,
  },
  smtpUsername: {
    type: String,
    default: 'noreply@example.com',
  },
  smtpPassword: {
    type: String,
    default: '',
  },
  smtpFrom: {
    type: String,
    default: 'noreply@example.com',
  },
  enableEmailNotifications: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Settings = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;