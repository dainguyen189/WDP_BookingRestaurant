// Script tự động thêm cấu hình SMS vào file .env
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('🔧 THIẾT LẬP CẤU HÌNH SMS eSMS\n');
console.log('='.repeat(50));

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log('❌ File .env không tồn tại!');
  console.log('💡 Vui lòng tạo file .env trước\n');
  process.exit(1);
}

// Read existing .env file
let envContent = fs.readFileSync(envPath, 'utf8');

console.log('📋 Kiểm tra cấu hình SMS hiện tại:\n');

// Check existing config
const hasESMS_API_KEY = envContent.includes('ESMS_API_KEY=');
const hasESMS_SECRET_KEY = envContent.includes('ESMS_SECRET_KEY=');
const hasESMS_SMS_TYPE = envContent.includes('ESMS_SMS_TYPE=');

console.log('ESMS_API_KEY:', hasESMS_API_KEY ? '✅ Đã có' : '❌ Chưa có');
console.log('ESMS_SECRET_KEY:', hasESMS_SECRET_KEY ? '✅ Đã có' : '❌ Chưa có');
console.log('ESMS_SMS_TYPE:', hasESMS_SMS_TYPE ? '✅ Đã có' : '❌ Chưa có');
console.log('');

// If all configs exist
if (hasESMS_API_KEY && hasESMS_SECRET_KEY && hasESMS_SMS_TYPE) {
  console.log('✅ Tất cả cấu hình SMS đã có trong file .env');
  
  // Extract current values
  const apiKeyMatch = envContent.match(/ESMS_API_KEY=(.+)/);
  const secretKeyMatch = envContent.match(/ESMS_SECRET_KEY=(.+)/);
  const smsTypeMatch = envContent.match(/ESMS_SMS_TYPE=(.+)/);
  
  console.log('\n📋 Giá trị hiện tại:');
  if (apiKeyMatch) console.log('   ESMS_API_KEY:', apiKeyMatch[1].trim() || '(chưa điền)');
  if (secretKeyMatch) console.log('   ESMS_SECRET_KEY:', secretKeyMatch[1].trim() ? '***' : '(chưa điền)');
  if (smsTypeMatch) console.log('   ESMS_SMS_TYPE:', smsTypeMatch[1].trim());
  
  console.log('\n💡 Khuyến nghị:');
  console.log('   - ESMS_SMS_TYPE=8 (SMS không Brandname - dễ nhất)');
  console.log('   - Lấy API Key tại: https://esms.vn');
  
  process.exit(0);
}

// Add missing configurations
console.log('🔧 Đang thêm cấu hình SMS còn thiếu...\n');

let updated = false;

// Add SMS section if not exists
if (!envContent.includes('# eSMS Configuration') && !envContent.includes('# SMS')) {
  envContent += '\n# eSMS Configuration\n';
  updated = true;
}

// Add ESMS_API_KEY if missing
if (!hasESMS_API_KEY) {
  envContent += 'ESMS_API_KEY=your-esms-api-key\n';
  console.log('✅ Đã thêm: ESMS_API_KEY (vui lòng cập nhật giá trị)');
  updated = true;
}

// Add ESMS_SECRET_KEY if missing
if (!hasESMS_SECRET_KEY) {
  envContent += 'ESMS_SECRET_KEY=your-esms-secret-key\n';
  console.log('✅ Đã thêm: ESMS_SECRET_KEY (vui lòng cập nhật giá trị)');
  updated = true;
}

// Add ESMS_SMS_TYPE if missing
if (!hasESMS_SMS_TYPE) {
  envContent += 'ESMS_SMS_TYPE=8\n';
  console.log('✅ Đã thêm: ESMS_SMS_TYPE=8 (SMS không Brandname)');
  updated = true;
}

// Write back to file
if (updated) {
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Đã cập nhật file .env thành công!');
  console.log('\n📝 Tiếp theo:');
  console.log('   1. Mở file .env và cập nhật ESMS_API_KEY và ESMS_SECRET_KEY');
  console.log('   2. Lấy API Key tại: https://esms.vn → Cài đặt → API');
  console.log('   3. Khởi động lại server: npm start');
  console.log('   4. Test SMS: node test-sms.js\n');
} else {
  console.log('ℹ️  Không có thay đổi nào cần thiết\n');
}

console.log('='.repeat(50));
console.log('\n💡 Lưu ý quan trọng:');
console.log('   - ESMS_SMS_TYPE=8: SMS không Brandname (khuyến nghị)');
console.log('   - ESMS_SMS_TYPE=2: SMS có Brandname (cần đăng ký trước)');
console.log('   - Xem chi tiết: SMS_CONFIG_GUIDE.md\n');

