const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// 密码哈希方法
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// 主函数
async function createVipUser() {
  try {
    // 连接数据库
    const MONGODB_URI = 'mongodb://localhost:27017/douyin-blogger-platform';
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('数据库连接成功');

    // VIP用户信息
    const vipUserData = {
      username: 'vipuser',
      email: 'vip@example.com',
      password: 'vip123456',
      role: 'vip',
      isVip: true,
      isSvip: false,
      vipExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
      svipExpiresAt: null,
      downloadCount: 0,
      maxDownloads: 50, // VIP用户最大下载次数
    };

    // 检查用户是否存在
    let user = await User.findOne({ 
      $or: [
        { username: vipUserData.username },
        { email: vipUserData.email }
      ] 
    });

    if (user) {
      // 更新现有用户
      console.log('用户已存在，更新为VIP...');
      user.role = 'vip';
      user.isVip = true;
      user.vipExpiresAt = vipUserData.vipExpiresAt;
      user.maxDownloads = vipUserData.maxDownloads;
      await user.save();
      console.log('用户已更新为VIP');
    } else {
      // 创建新用户
      console.log('创建新VIP用户...');
      user = new User({
        ...vipUserData,
      });
      await user.save();
      console.log('VIP用户创建成功');
    }

    // 显示用户信息
    console.log('VIP用户信息:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isVip: user.isVip,
      vipExpiresAt: user.vipExpiresAt,
      maxDownloads: user.maxDownloads,
      createdAt: user.createdAt,
    });

    console.log('\n✅ VIP账号信息:');
    console.log('用户名:', vipUserData.username);
    console.log('邮箱:', vipUserData.email);
    console.log('密码:', vipUserData.password);
    console.log('角色:', vipUserData.role);
    console.log('有效期:', vipUserData.vipExpiresAt);

  } catch (error) {
    console.error('错误:', error);
  } finally {
    // 断开连接
    await mongoose.disconnect();
    console.log('数据库连接已断开');
  }
}

// 执行函数
createVipUser();