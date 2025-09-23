import QRCode from 'qrcode';
import fs from 'fs';

// Common certificate patterns to try
const certificatePatterns = [
  'HAL-2025-1001',
  'HAL-2025-1002',
  'HAL-2025-1003',
  'HAL-2025-1004',
  'HAL-2025-1005',
  'HAL-2024-1001',
  'HAL-2024-1002',
  'HAL-2024-1003'
];

async function generateQRCodeForCertificate(certificateNumber) {
  try {
    const verificationUrl = `https://halalextra-production.up.railway.app/verify/${certificateNumber}`;

    console.log(`\n🎯 Generating QR Code for ${certificateNumber}`);
    console.log(`🔗 URL: ${verificationUrl}`);

    const dataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });

    // Save QR code to disk
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const fileName = `/tmp/qr_${certificateNumber.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    fs.writeFileSync(fileName, base64Data, 'base64');

    const fileStats = fs.statSync(fileName);
    console.log(`✅ QR Code saved: ${fileName} (${Math.round(fileStats.size / 1024 * 10) / 10} KB)`);

    return {
      certificateNumber,
      verificationUrl,
      fileName,
      fileSize: fileStats.size
    };
  } catch (error) {
    console.error(`❌ Error generating QR code for ${certificateNumber}:`, error);
    return null;
  }
}

async function generateAllQRCodes() {
  console.log('🚀 Generating QR Codes for Multiple Certificate Patterns\n');

  const results = [];

  for (const certNumber of certificatePatterns) {
    const result = await generateQRCodeForCertificate(certNumber);
    if (result) {
      results.push(result);
    }
  }

  console.log('\n📋 Summary of Generated QR Codes:');
  console.log('=====================================');

  results.forEach((result, index) => {
    console.log(`${index + 1}. Certificate: ${result.certificateNumber}`);
    console.log(`   🔗 URL: ${result.verificationUrl}`);
    console.log(`   📄 File: ${result.fileName}`);
    console.log(`   📊 Size: ${Math.round(result.fileSize / 1024 * 10) / 10} KB`);
    console.log('');
  });

  console.log(`\n🎉 Generated ${results.length} QR codes successfully!`);
  console.log('\n📱 Test these QR codes by:');
  console.log('1. Scanning with phone camera');
  console.log('2. Opening the verification URLs in browser');
  console.log('3. Looking for certificates that show as "Active" instead of "Not Found"');
  console.log('\n💡 Once you find a working certificate, you have a functional QR code!');

  return results;
}

// Execute the generator
generateAllQRCodes().catch(error => {
  console.error('\n💥 Unexpected error:', error);
});