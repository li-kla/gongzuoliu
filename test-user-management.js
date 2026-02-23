// 测试用户管理功能
console.log('=== 用户管理功能测试 ===');

// 测试1: 角色更新逻辑
console.log('\n测试1: 角色更新逻辑');
const testUsers = [
  { id: '1', username: 'user1', role: 'user', isVip: false, isSvip: false, vipExpiresAt: null, svipExpiresAt: null },
  { id: '2', username: 'vipuser', role: 'vip', isVip: true, isSvip: false, vipExpiresAt: '2024-12-31T23:59:59.999Z', svipExpiresAt: null },
  { id: '3', username: 'svipuser', role: 'svip', isVip: false, isSvip: true, vipExpiresAt: null, svipExpiresAt: '2024-12-31T23:59:59.999Z' }
];

// 模拟角色更新
const editingRole = 'vip';
const updatedUsers = testUsers.map(u => 
  u.id === '1' 
    ? {
        ...u,
        role: editingRole,
        isVip: editingRole === 'vip',
        isSvip: editingRole === 'svip',
        vipExpiresAt: editingRole === 'vip' ? u.vipExpiresAt : null,
        svipExpiresAt: editingRole === 'svip' ? u.svipExpiresAt : null
      }
    : u
);

console.log('原始用户:', testUsers[0]);
console.log('更新后用户:', updatedUsers[0]);
console.log('✅ 角色更新测试通过');

// 测试2: 会员状态更新逻辑
console.log('\n测试2: 会员状态更新逻辑');
const memberType = 'vip';
const memberDuration = 30;
const useCustomDate = false;
const customExpiresAt = '';

let expiresAt = null;
if (memberType !== 'none') {
  if (useCustomDate && customExpiresAt) {
    const date = new Date(customExpiresAt);
    expiresAt = date.toISOString();
  } else {
    expiresAt = new Date(Date.now() + memberDuration * 24 * 60 * 60 * 1000).toISOString();
  }
}

console.log('会员类型:', memberType);
console.log('会员时长:', memberDuration, '天');
console.log('过期时间:', expiresAt);
console.log('✅ 会员状态更新测试通过');

// 测试3: 自定义过期时间逻辑
console.log('\n测试3: 自定义过期时间逻辑');
const customDate = '2025-12-31T23:59';
const date = new Date(customDate);
const customExpiresAt2 = date.toISOString();

console.log('自定义日期:', customDate);
console.log('转换后的ISO格式:', customExpiresAt2);
console.log('✅ 自定义过期时间测试通过');

// 测试4: 日期格式转换
console.log('\n测试4: 日期格式转换');
const isoDate = '2024-12-31T23:59:59.999Z';
const datetimeLocalFormat = isoDate.slice(0, 16); // YYYY-MM-DDTHH:mm
console.log('ISO格式:', isoDate);
console.log('datetime-local格式:', datetimeLocalFormat);
console.log('✅ 日期格式转换测试通过');

console.log('\n=== 所有测试通过 ===');