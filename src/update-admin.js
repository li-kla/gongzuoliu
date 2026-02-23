const mongoose = require('mongoose');

async function updateAdminToSuperAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27018/douyin-blogger-platform');
    console.log('数据库连接成功！');

    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true, trim: true },
      email: { type: String, required: true, unique: true, trim: true, lowercase: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['superadmin', 'admin', 'user', 'vip', 'svip'], default: 'user' },
      isSuperAdmin: { type: Boolean, default: false },
      isVip: { type: Boolean, default: false },
      isSvip: { type: Boolean, default: false },
      vipExpiresAt: { type: Date, default: null },
      svipExpiresAt: { type: Date, default: null },
      downloadCount: { type: Number, default: 0 },
      maxDownloads: { type: Number, default: 0 },
      avatar: { type: String, default: '' },
    }, { timestamps: true });

    const User = mongoose.model('User', userSchema);

    // 查找现有的管理员账户
    const adminUser = await User.findOne({ role: 'admin' });
    if (adminUser) {
      console.log('找到管理员账户:', adminUser.username);
      
      // 更新为超级管理员
      adminUser.role = 'superadmin';
      adminUser.isSuperAdmin = true;
      await adminUser.save();
      
      console.log('管理员账户已更新为超级管理员！');
      console.log('用户名:', adminUser.username);
      console.log('邮箱:', adminUser.email);
      console.log('角色:', adminUser.role);
      console.log('是否为超级管理员:', adminUser.isSuperAdmin);
    } else {
      console.log('没有找到管理员账户');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('更新管理员账户失败:', error);
  }
}

updateAdminToSuperAdmin();