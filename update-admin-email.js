const mongoose = require('mongoose');

// 创建用户模型
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'vip', 'svip'],
    default: 'user',
  },
  isVip: {
    type: Boolean,
    default: false,
  },
  isSvip: {
    type: Boolean,
    default: false,
  },
  vipExpiresAt: {
    type: Date,
    default: null,
  },
  svipExpiresAt: {
    type: Date,
    default: null,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  maxDownloads: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// 主函数
async function updateAdminEmail() {
  try {
    // 连接数据库
    const MONGODB_URI = 'mongodb://localhost:27017/douyin-blogger-platform';
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('数据库连接成功');

    // 查找用户
    const user = await User.findOne({ 
      username: 'lixiaojian' 
    });

    if (user) {
      // 更新邮箱
      console.log('找到用户，更新邮箱...');
      user.email = '754455705@qq.com';
      await user.save();
      console.log('邮箱更新成功');

      // 显示更新后的用户信息
      console.log('更新后的用户信息:', {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      });
    } else {
      console.log('用户不存在');
    }

  } catch (error) {
    console.error('错误:', error);
  } finally {
    // 断开连接
    await mongoose.disconnect();
    console.log('数据库连接已断开');
  }
}

// 执行函数
updateAdminEmail();
