import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IArticle extends Document {
  title: string;
  workflowName: string;
  bloggerName?: string; // 兼容旧字段
  content: string;
  titleFontSize?: string; // 标题字体大小
  contentFontSize?: string; // 内容字体大小
  videoUrl: string;
  fileUrl: string;
  author: mongoose.Types.ObjectId | IUser;
  benchmarkAccounts?: Array<{
    name: string; // 对标账号名称
    url: string; // 对标账号链接
  }>; // 对标账号数组
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema<IArticle> = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  workflowName: {
    type: String,
    required: true,
    trim: true,
  },
  bloggerName: {
    type: String,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  titleFontSize: {
    type: String,
    default: 'text-base',
  },
  contentFontSize: {
    type: String,
    default: 'text-sm',
  },
  videoUrl: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  benchmarkAccounts: [{
    name: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
  }],
}, {
  timestamps: true,
  // 添加虚拟字段和中间件
  toJSON: {
    transform: function(doc, ret) {
      // 确保返回workflowName
      if (!ret.workflowName && ret.bloggerName) {
        ret.workflowName = ret.bloggerName;
      }
      delete ret.bloggerName;
      return ret;
    }
  }
});

// 保存前的中间件，确保字段一致性
ArticleSchema.pre('save', function(next) {
  if (this.bloggerName && !this.workflowName) {
    this.workflowName = this.bloggerName;
  }
  next();
});

const Article = mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;