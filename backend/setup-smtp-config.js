// Script tự động thêm cấu hình SMTP vào file .env
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");

console.log("🔧 THIẾT LẬP CẤU HÌNH SMTP\n");
console.log("=".repeat(50));

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log("❌ File .env không tồn tại!");
  console.log("💡 Tạo file .env mới...\n");

  // Create basic .env file
  const basicEnv = `# Email Configuration
EMAIL_USER=your-email@fpt.edu.vn
EMAIL_PASS=your-password-here

# SMTP Configuration for FPT Email
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false

# MongoDB
MONGO_URI=mongodb://localhost:27017/restaurant

# JWT Secret
JWT_SECRET=your-secret-key-here

# Server Port
PORT=8080

# Client URL
CLIENT_URL=http://localhost:5173
`;

  fs.writeFileSync(envPath, basicEnv);
  console.log("✅ Đã tạo file .env mới với cấu hình SMTP mặc định");
  console.log(
    "📝 Vui lòng cập nhật EMAIL_USER và EMAIL_PASS trong file .env\n",
  );
  process.exit(0);
}

// Read existing .env file
let envContent = fs.readFileSync(envPath, "utf8");

console.log("📋 Kiểm tra cấu hình hiện tại:\n");

// Check existing config
const hasSMTP_HOST = envContent.includes("SMTP_HOST=");
const hasSMTP_PORT = envContent.includes("SMTP_PORT=");
const hasSMTP_SECURE = envContent.includes("SMTP_SECURE=");

console.log("SMTP_HOST:", hasSMTP_HOST ? "✅ Đã có" : "❌ Chưa có");
console.log("SMTP_PORT:", hasSMTP_PORT ? "✅ Đã có" : "❌ Chưa có");
console.log("SMTP_SECURE:", hasSMTP_SECURE ? "✅ Đã có" : "❌ Chưa có");
console.log("");

// If all configs exist, check if they need update
if (hasSMTP_HOST && hasSMTP_PORT && hasSMTP_SECURE) {
  console.log("✅ Tất cả cấu hình SMTP đã có trong file .env");
  console.log("💡 Nếu vẫn lỗi, kiểm tra giá trị có đúng không:\n");

  // Extract current values
  const smtpHostMatch = envContent.match(/SMTP_HOST=(.+)/);
  const smtpPortMatch = envContent.match(/SMTP_PORT=(.+)/);
  const smtpSecureMatch = envContent.match(/SMTP_SECURE=(.+)/);

  if (smtpHostMatch) console.log("   SMTP_HOST:", smtpHostMatch[1].trim());
  if (smtpPortMatch) console.log("   SMTP_PORT:", smtpPortMatch[1].trim());
  if (smtpSecureMatch)
    console.log("   SMTP_SECURE:", smtpSecureMatch[1].trim());

  console.log("\n💡 Khuyến nghị cho email FPT:");
  console.log("   SMTP_HOST=smtp.office365.com");
  console.log("   SMTP_PORT=587");
  console.log("   SMTP_SECURE=false");
  process.exit(0);
}

// Add missing configurations
console.log("🔧 Đang thêm cấu hình SMTP còn thiếu...\n");

let updated = false;

// Add SMTP section if not exists
if (!envContent.includes("# SMTP Configuration")) {
  envContent += "\n# SMTP Configuration for FPT Email\n";
  updated = true;
}

// Add SMTP_HOST if missing
if (!hasSMTP_HOST) {
  envContent += "SMTP_HOST=smtp.office365.com\n";
  console.log("✅ Đã thêm: SMTP_HOST=smtp.office365.com");
  updated = true;
}

// Add SMTP_PORT if missing
if (!hasSMTP_PORT) {
  envContent += "SMTP_PORT=587\n";
  console.log("✅ Đã thêm: SMTP_PORT=587");
  updated = true;
}

// Add SMTP_SECURE if missing
if (!hasSMTP_SECURE) {
  envContent += "SMTP_SECURE=false\n";
  console.log("✅ Đã thêm: SMTP_SECURE=false");
  updated = true;
}

// Write back to file
if (updated) {
  fs.writeFileSync(envPath, envContent);
  console.log("\n✅ Đã cập nhật file .env thành công!");
  console.log("📝 Vui lòng khởi động lại server để áp dụng thay đổi\n");
} else {
  console.log("ℹ️  Không có thay đổi nào cần thiết\n");
}

console.log("=".repeat(50));
console.log("\n💡 Tiếp theo:");
console.log("   1. Kiểm tra lại file .env");
console.log("   2. Đảm bảo EMAIL_USER và EMAIL_PASS đã được cấu hình");
console.log("   3. Khởi động lại server: npm start");
console.log("   4. Test email: node test-email.js\n");
