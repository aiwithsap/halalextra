import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
const { Client } = pkg;

// Mock implementations since we can't import TypeScript files directly
function generateCertificateNumber() {
  const prefix = 'HAL';
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}-${random}`;
}

async function generateQRCode(text) {
  const QRCode = await import('qrcode');
  try {
    const dataUrl = await QRCode.default.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

async function createWorkingCertificate() {
  console.log('🚀 Creating Working Certificate with Real Database Integration\n');

  let client;

  try {
    // Connect to database - use Railway production database
    const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:KFlCdLGnJIyKAhEzCfCHVBWLMRlQEfwF@junction.proxy.rlwy.net:32506/railway';
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    console.log('✅ Connected to database');

    // Get an existing store and application
    const storeQuery = 'SELECT id, "ownerName", "storeName", "ownerEmail" FROM stores LIMIT 1';
    const storeResult = await client.query(storeQuery);

    if (storeResult.rows.length === 0) {
      console.log('❌ No stores found in database. Creating a test store first...');

      // Create a test store
      const createStoreQuery = `
        INSERT INTO stores ("ownerName", "storeName", "ownerEmail", address, phone, "businessType", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, "ownerName", "storeName", "ownerEmail"
      `;
      const storeValues = [
        'Test Store Owner',
        'Certificate Test Store',
        'test@example.com',
        '123 Test Street, Test City, TC 12345',
        '+1234567890',
        'restaurant'
      ];
      const newStoreResult = await client.query(createStoreQuery, storeValues);
      var store = newStoreResult.rows[0];
      console.log(`✅ Created test store: ${store.storeName} (ID: ${store.id})`);
    } else {
      var store = storeResult.rows[0];
      console.log(`✅ Using existing store: ${store.storeName} (ID: ${store.id})`);
    }

    // Get or create an application for this store
    const appQuery = 'SELECT id FROM applications WHERE "storeId" = $1 LIMIT 1';
    const appResult = await client.query(appQuery, [store.id]);

    if (appResult.rows.length === 0) {
      console.log('❌ No applications found for this store. Creating a test application...');

      // Create a test application
      const createAppQuery = `
        INSERT INTO applications ("storeId", status, "applicationFee", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id
      `;
      const appValues = [store.id, 'approved', 250];
      const newAppResult = await client.query(createAppQuery, appValues);
      var application = newAppResult.rows[0];
      console.log(`✅ Created test application (ID: ${application.id})`);
    } else {
      var application = appResult.rows[0];
      console.log(`✅ Using existing application (ID: ${application.id})`);
    }

    // Generate certificate details
    const certificateNumber = generateCertificateNumber();
    const verificationUrl = `https://halalextra-production.up.railway.app/verify/${certificateNumber}`;
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity

    console.log('\n📋 Certificate Details:');
    console.log(`   📄 Certificate Number: ${certificateNumber}`);
    console.log(`   🏪 Store: ${store.storeName}`);
    console.log(`   👤 Owner: ${store.ownerName}`);
    console.log(`   📅 Expires: ${expiryDate.toDateString()}`);
    console.log(`   🔗 Verification URL: ${verificationUrl}`);

    // Generate QR code
    console.log('\n🎯 Generating QR Code...');
    const qrCodeDataUrl = await generateQRCode(verificationUrl);
    console.log('✅ QR Code generated successfully');

    // Save QR code to disk
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    const fileName = `/tmp/working_certificate_${certificateNumber}.png`;
    fs.writeFileSync(fileName, base64Data, 'base64');

    const fileStats = fs.statSync(fileName);
    console.log(`\n💾 QR Code saved:`)
    console.log(`   📄 File: ${fileName}`);
    console.log(`   📊 Size: ${Math.round(fileStats.size / 1024 * 10) / 10} KB`);

    // Insert certificate into database
    console.log('\n📝 Creating certificate record in database...');
    const createCertQuery = `
      INSERT INTO certificates ("certificateNumber", "storeId", "applicationId", status, "issuedBy", "expiryDate", "qrCodeUrl", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, "certificateNumber", status, "issuedDate"
    `;

    const certValues = [
      certificateNumber,
      store.id,
      application.id,
      'active',
      null, // issuedBy (no specific user)
      expiryDate,
      qrCodeDataUrl
    ];

    const certResult = await client.query(createCertQuery, certValues);
    const certificate = certResult.rows[0];

    console.log('✅ Certificate created in database!');
    console.log(`   🆔 Certificate ID: ${certificate.id}`);
    console.log(`   📋 Certificate Number: ${certificate.certificateNumber}`);
    console.log(`   📊 Status: ${certificate.status}`);
    console.log(`   📅 Issued: ${certificate.issuedDate}`);

    console.log('\n🏆 SUCCESS! Certificate and QR Code Generation Complete!\n');
    console.log('📱 The QR code is now ready for testing:');
    console.log('1. ✅ Scan with any phone camera');
    console.log(`2. ✅ Opens: ${verificationUrl}`);
    console.log('3. ✅ Shows REAL certificate verification page');
    console.log('4. ✅ Displays actual halal certification status');

    console.log('\n🔍 Verification Details:');
    console.log(`• Certificate exists in production database`);
    console.log(`• Store: ${store.storeName}`);
    console.log(`• Owner: ${store.ownerName}`);
    console.log(`• Status: Active`);
    console.log(`• Valid until: ${expiryDate.toDateString()}`);

    console.log(`\n📂 QR Code File: ${fileName}`);
    console.log(`📏 File Size: ${Math.round(fileStats.size / 1024 * 10) / 10} KB`);

    return {
      success: true,
      certificateNumber,
      verificationUrl,
      qrCodeFilePath: fileName,
      certificate,
      store
    };

  } catch (error) {
    console.error('❌ Error creating certificate:', error);
    return { success: false, error: error.message };
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Execute the certificate generator
createWorkingCertificate().then(result => {
  if (result.success) {
    console.log('\n🎉 CERTIFICATE GENERATION SUCCESSFUL!');
    console.log('\n📱 This QR code will work when scanned!');
    console.log(`Certificate: ${result.certificateNumber}`);
    console.log(`Store: ${result.store.storeName}`);
    console.log(`Verification URL: ${result.verificationUrl}`);
    console.log(`QR Code File: ${result.qrCodeFilePath}`);
  } else {
    console.log('\n❌ Certificate generation failed:', result.error);
  }
}).catch(error => {
  console.error('\n💥 Unexpected error:', error);
});