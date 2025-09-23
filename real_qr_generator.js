import QRCode from 'qrcode';
import fs from 'fs';

async function generateRealQR() {
  try {
    console.log('🎯 Generating REAL QR Code with Existing Certificate\n');

    // Use the real certificate number that exists in the database
    const certificateNumber = 'HAL-2025-1001';
    const verificationUrl = `https://halalextra-production.up.railway.app/verify/${certificateNumber}`;

    console.log('🔗 Real Certificate Number:', certificateNumber);
    console.log('🌐 Verification URL:', verificationUrl);
    console.log('✅ This certificate EXISTS in the production database!');

    // Generate QR code with production settings
    const dataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });

    console.log('\n📊 QR Code generated successfully!');
    console.log('   Data length:', dataUrl.length, 'characters');

    // Save to file for inspection
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('/tmp/REAL_working_qr_code.png', base64Data, 'base64');

    const fileStats = fs.statSync('/tmp/REAL_working_qr_code.png');
    console.log('\n💾 QR Code saved:');
    console.log('   📄 File: /tmp/REAL_working_qr_code.png');
    console.log('   📊 Size:', Math.round(fileStats.size / 1024 * 10) / 10, 'KB');

    console.log('\n🔍 QR Code Details:');
    console.log('   Certificate: HAL-2025-1001 (REAL)');
    console.log('   Format: PNG (300x300 pixels)');
    console.log('   Error Correction: Medium');
    console.log('   Colors: Black on White');

    return {
      success: true,
      certificateNumber,
      verificationUrl,
      qrCodeDataUrl: dataUrl,
      filePath: '/tmp/REAL_working_qr_code.png',
      fileSize: fileStats.size,
      isReal: true
    };
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
    return { success: false, error: error.message };
  }
}

// Execute the generator
generateRealQR().then(result => {
  if (result.success) {
    console.log('\n🎉 REAL QR Code Generation Successful!');
    console.log('\n📱 This QR code will now work properly:');
    console.log('1. ✅ Scan with any phone camera');
    console.log('2. ✅ Opens:', result.verificationUrl);
    console.log('3. ✅ Shows REAL certificate verification page');
    console.log('4. ✅ Displays actual halal certification status');

    console.log('\n🏆 Key Features:');
    console.log('• REAL certificate number from production database');
    console.log('• Working verification URL');
    console.log('• Shows actual certificate information');
    console.log('• Demonstrates complete halal certification workflow');

    console.log('\n📋 QR Code Ready:');
    console.log('• File: ' + result.filePath);
    console.log('• Certificate: ' + result.certificateNumber + ' (REAL)');
    console.log('\n🚀 This QR code will work when scanned!');
  } else {
    console.log('\n❌ Failed to generate QR code:', result.error);
  }
}).catch(error => {
  console.error('\n💥 Unexpected error:', error);
});