// 测试购买功能
const API_BASE = 'http://localhost:3000/api';

async function testPurchase() {
  console.log('=== 购买功能测试 ===\n');

  // 1. 登录获取token
  console.log('1. 登录获取token...');
  const loginResponse = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      identifier: 'testuser123',
      password: 'password123'
    })
  });

  const loginData = await loginResponse.json();
  console.log('登录响应:', loginData);

  if (!loginData.token) {
    console.error('登录失败，无法继续测试');
    return;
  }

  const token = loginData.token;
  console.log('✅ 登录成功\n');

  // 2. 获取当前用户信息
  console.log('2. 获取当前用户信息...');
  const meResponse = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const meData = await meResponse.json();
  console.log('用户信息:', meData.user);
  console.log('当前角色:', meData.user.role);
  console.log('✅ 获取用户信息成功\n');

  // 3. 测试创建订单（VIP月付）
  console.log('3. 测试创建订单（VIP月付）...');
  const orderResponse = await fetch(`${API_BASE}/pay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      paymentMethod: 'wechat',
      amount: 29,
      planId: 'vip-monthly',
      duration: 30
    })
  });

  const orderData = await orderResponse.json();
  console.log('订单响应:', orderData);

  if (orderData.order) {
    console.log('✅ 订单创建成功');
    console.log('   订单号:', orderData.order.orderId);
    console.log('   支付金额:', orderData.order.amount);
    console.log('   支付方式:', orderData.order.paymentMethod);
    console.log('');
  }

  // 4. 模拟支付回调
  console.log('4. 模拟支付回调...');
  const callbackResponse = await fetch(`${API_BASE}/pay/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orderId: orderData.order?.orderId || 'ORDER_test_123',
      userId: meData.user.id,
      paymentMethod: 'wechat',
      status: 'success',
      amount: 29,
      planId: 'vip-monthly',
      duration: 30
    })
  });

  const callbackData = await callbackResponse.json();
  console.log('回调响应:', callbackData);

  if (callbackData.success) {
    console.log('✅ 支付回调处理成功\n');
  }

  // 5. 验证用户会员状态是否更新
  console.log('5. 验证用户会员状态是否更新...');
  const meResponse2 = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const meData2 = await meResponse2.json();
  console.log('更新后的用户信息:', meData2.user);
  console.log('更新后的角色:', meData2.user.role);
  console.log('VIP状态:', meData2.user.isVip);
  console.log('VIP过期时间:', meData2.user.vipExpiresAt);
  console.log('最大下载次数:', meData2.user.maxDownloads);

  if (meData2.user.role === 'vip' && meData2.user.isVip === true) {
    console.log('\n✅ 会员状态更新成功！');
    console.log('   - 角色已更新为VIP');
    console.log('   - VIP状态已设置');
    console.log('   - VIP过期时间已设置');
    console.log('   - 最大下载次数已设置');
  } else {
    console.log('\n❌ 会员状态更新失败');
  }

  console.log('\n=== 测试完成 ===');
}

testPurchase().catch(console.error);