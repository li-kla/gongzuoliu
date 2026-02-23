// 测试用户管理API
const API_BASE = 'http://localhost:3000/api';

// 测试函数
async function testUserManagementAPI() {
  console.log('=== 用户管理API测试 ===\n');

  // 1. 首先登录获取token
  console.log('1. 登录获取token...');
  const loginResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      identifier: 'admin',
      password: 'admin123'
    })
  });

  const loginData = await loginResponse.json();
  console.log('登录响应:', loginData);

  if (!loginData.token) {
    console.error('登录失败，无法继续测试');
    return;
  }

  const token = loginData.token;
  console.log('✅ 登录成功，获取到token\n');

  // 2. 获取用户列表
  console.log('2. 获取用户列表...');
  const usersResponse = await fetch(`${API_BASE}/users`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const usersData = await usersResponse.json();
  console.log('用户列表响应:', usersData);

  if (usersData.users && usersData.users.length > 0) {
    console.log(`✅ 成功获取 ${usersData.users.length} 个用户\n`);

    // 3. 测试更新用户角色
    const testUser = usersData.users[0];
    console.log('3. 测试更新用户角色...');
    console.log('测试用户:', testUser.username, '当前角色:', testUser.role);

    const newRole = testUser.role === 'user' ? 'vip' : 'user';
    const roleUpdateResponse = await fetch(`${API_BASE}/users/${testUser.id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ role: newRole })
    });

    const roleUpdateData = await roleUpdateResponse.json();
    console.log('角色更新响应:', roleUpdateData);

    if (roleUpdateData.user) {
      console.log(`✅ 角色更新成功: ${testUser.role} -> ${roleUpdateData.user.role}\n`);

      // 4. 测试更新会员状态
      console.log('4. 测试更新会员状态...');
      const membershipUpdateResponse = await fetch(`${API_BASE}/users/${testUser.id}/membership`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          memberType: 'vip',
          memberDuration: 60,
          useCustomDate: false
        })
      });

      const membershipUpdateData = await membershipUpdateResponse.json();
      console.log('会员状态更新响应:', membershipUpdateData);

      if (membershipUpdateData.user) {
        console.log(`✅ 会员状态更新成功`);
        console.log(`   VIP状态: ${membershipUpdateData.user.isVip}`);
        console.log(`   VIP过期时间: ${membershipUpdateData.user.vipExpiresAt}\n`);

        // 5. 测试自定义过期时间
        console.log('5. 测试自定义过期时间...');
        const customDate = new Date();
        customDate.setMonth(customDate.getMonth() + 3); // 3个月后

        const customDateResponse = await fetch(`${API_BASE}/users/${testUser.id}/membership`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            memberType: 'vip',
            useCustomDate: true,
            customExpiresAt: customDate.toISOString()
          })
        });

        const customDateData = await customDateResponse.json();
        console.log('自定义过期时间响应:', customDateData);

        if (customDateData.user) {
          console.log(`✅ 自定义过期时间更新成功`);
          console.log(`   VIP过期时间: ${customDateData.user.vipExpiresAt}\n`);
        }
      }
    }
  } else {
    console.log('❌ 获取用户列表失败\n');
  }

  console.log('=== 测试完成 ===');
}

// 运行测试
testUserManagementAPI().catch(console.error);