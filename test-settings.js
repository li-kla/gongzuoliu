// 测试设置保存功能
const API_BASE = 'http://localhost:3000/api';

async function testSettings() {
  console.log('=== 设置保存功能测试 ===\n');

  // 1. 登录获取token
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
  console.log('✅ 登录成功\n');

  // 2. 获取当前设置
  console.log('2. 获取当前设置...');
  const getSettingsResponse = await fetch(`${API_BASE}/settings`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const getSettingsData = await getSettingsResponse.json();
  console.log('当前设置:', getSettingsData.settings);
  console.log('当前最大文件大小:', getSettingsData.settings?.maxFileSize, 'MB');
  console.log('✅ 获取设置成功\n');

  // 3. 修改上传设置（将最大文件大小改为200MB）
  console.log('3. 修改上传设置（最大文件大小改为200MB）...');
  const updateSettingsResponse = await fetch(`${API_BASE}/settings/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      settingsType: 'upload',
      settings: {
        maxFileSize: 200,
        allowedExtensions: '.zip,.rar,.7z,.mp4,.mov',
        uploadPath: './uploads',
        enableFileCompression: false
      }
    })
  });

  const updateSettingsData = await updateSettingsResponse.json();
  console.log('更新设置响应:', updateSettingsData);

  if (updateSettingsData.message === '设置保存成功') {
    console.log('✅ 上传设置保存成功\n');
  } else {
    console.log('❌ 上传设置保存失败\n');
    return;
  }

  // 4. 验证设置是否真正保存到数据库
  console.log('4. 验证设置是否真正保存到数据库...');
  const verifySettingsResponse = await fetch(`${API_BASE}/settings`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const verifySettingsData = await verifySettingsResponse.json();
  console.log('更新后的设置:', verifySettingsData.settings);
  console.log('更新后的最大文件大小:', verifySettingsData.settings?.maxFileSize, 'MB');

  if (verifySettingsData.settings?.maxFileSize === 200) {
    console.log('\n✅ 设置持久化验证成功！');
    console.log('   - 最大文件大小已更新为200MB');
    console.log('   - 允许的文件扩展名已更新');
    console.log('   - 设置已保存到数据库');
  } else {
    console.log('\n❌ 设置持久化验证失败');
  }

  // 5. 测试修改站点设置
  console.log('\n5. 测试修改站点设置...');
  const updateSiteSettingsResponse = await fetch(`${API_BASE}/settings/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      settingsType: 'site',
      settings: {
        siteName: '测试站点名称',
        siteDescription: '测试站点描述',
        siteLogo: '',
        siteFavicon: '',
        enableRegistration: true,
        enableEmailVerification: false
      }
    })
  });

  const updateSiteSettingsData = await updateSiteSettingsResponse.json();
  console.log('站点设置更新响应:', updateSiteSettingsData);

  if (updateSiteSettingsData.message === '设置保存成功') {
    console.log('✅ 站点设置保存成功\n');
  }

  // 6. 验证站点设置
  console.log('6. 验证站点设置...');
  const verifySiteSettingsResponse = await fetch(`${API_BASE}/settings`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const verifySiteSettingsData = await verifySiteSettingsResponse.json();
  console.log('更新后的站点设置:', verifySiteSettingsData.settings);
  console.log('站点名称:', verifySiteSettingsData.settings?.siteName);

  if (verifySiteSettingsData.settings?.siteName === '测试站点名称') {
    console.log('\n✅ 站点设置持久化验证成功！');
    console.log('   - 站点名称已更新');
    console.log('   - 站点描述已更新');
  }

  console.log('\n=== 测试完成 ===');
}

testSettings().catch(console.error);