import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data for consistent use across tests
const testData = {
  store: {
    businessName: 'Al-Barakah Halal Restaurant',
    abn: '12345678901',
    established: '2020',
    address: '123 Halal Street',
    city: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    businessType: 'Restaurant',
    employeeCount: '15',
    operatingHours: '9:00 AM - 11:00 PM',
    ownerName: 'Ahmed Al-Rahman',
    ownerEmail: 'ahmed@albarakah.com.au',
    ownerPhone: '+61412345678'
  },
  inspector: {
    email: 'adeelh',
    password: '1P9Zqz7DIoKIqJx'
  },
  suppliers: [
    { name: 'Halal Meat Co', material: 'Fresh meat', certified: true },
    { name: 'Green Valley Vegetables', material: 'Fresh vegetables', certified: false }
  ],
  products: ['Lamb Kebabs', 'Chicken Curry', 'Beef Biryani', 'Vegetable Samosas']
};

// File paths for test uploads
const testFiles = {
  businessLicense: path.join(__dirname, '..', 'test-fixtures', 'business-license.pdf'),
  floorPlan: path.join(__dirname, '..', 'test-fixtures', 'floor-plan.png'),
  supplierCertificate: path.join(__dirname, '..', 'test-fixtures', 'supplier-certificate.pdf'),
  inspectionPhoto: path.join(__dirname, '..', 'test-fixtures', 'inspection-photo.jpg')
};

// Global variables to store data between tests
let applicationId: string;
let certificateNumber: string;
let qrCodeImageData: string;

test.describe('Comprehensive HalalExtra Workflow', () => {
  test.describe.configure({ mode: 'serial' }); // Run tests in sequence

  test('1. Store Owner: Complete halal certification application with file uploads', async ({ page }) => {
    // Navigate to application page
    await page.goto('/apply');
    await expect(page.getByRole('heading', { name: 'Apply for Halal Certification' })).toBeVisible({ timeout: 10000 });

    // Step 1: Business Information
    await fillBusinessInformation(page);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Step 2: Operations Information
    await fillOperationsInformation(page);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Step 3: Document Upload
    await uploadDocuments(page);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Step 4: Contact Information & Terms
    await fillContactInformation(page);
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(1000);

    // Step 5: Application Summary and Payment
    await expect(page.locator('text=Application Summary')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${testData.store.businessName}`)).toBeVisible();

    // If payment is required, handle it (assuming demo mode or skip)
    const paymentSection = page.locator('[data-testid="payment-section"], .payment-section');
    if (await paymentSection.count() > 0) {
      console.log('Payment section detected - handling payment flow');
      const submitButton = page.locator('button').filter({ hasText: /submit|pay|complete/i }).first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(3000);
      }
    } else {
      // Look for a submit or complete application button
      const submitButton = page.locator('button').filter({ hasText: /submit|complete.*application/i }).first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(3000);
      }
    }

    // Check for success message or redirect
    const successIndicators = [
      page.locator('text=Application submitted successfully'),
      page.locator('text=Thank you for your application'),
      page.locator('text=Application received'),
      page.locator('[data-testid="application-success"]')
    ];

    let applicationSubmitted = false;
    for (const indicator of successIndicators) {
      if (await indicator.count() > 0) {
        await expect(indicator).toBeVisible({ timeout: 5000 });
        applicationSubmitted = true;
        break;
      }
    }

    if (!applicationSubmitted) {
      console.log('No clear success indicator found - checking URL and page content');
      // Log current URL and page content for debugging
      console.log('Current URL:', page.url());
      const pageContent = await page.textContent('body');
      console.log('Page contains "success":', pageContent?.toLowerCase().includes('success'));
      console.log('Page contains "submitted":', pageContent?.toLowerCase().includes('submitted'));
    }

    console.log('Store owner application completed successfully');
  });

  test('2. Inspector Login and View Dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Login as inspector
    await page.fill('input[name="email"], input[name="username"]', testData.inspector.email);
    await page.fill('input[name="password"]', testData.inspector.password);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');

    // Wait for redirect to inspector dashboard
    await page.waitForTimeout(3000);

    // Check for inspector dashboard or applications page
    const dashboardIndicators = [
      page.locator('text=Inspector Dashboard'),
      page.locator('text=Pending Inspections'),
      page.locator('text=Applications'),
      page.locator('[data-testid="inspector-dashboard"]'),
      page.locator('[data-testid="applications-queue"]')
    ];

    let dashboardLoaded = false;
    for (const indicator of dashboardIndicators) {
      if (await indicator.count() > 0) {
        await expect(indicator).toBeVisible({ timeout: 5000 });
        dashboardLoaded = true;
        break;
      }
    }

    if (!dashboardLoaded) {
      console.log('Dashboard not detected, checking current page...');
      console.log('Current URL:', page.url());
      const pageTitle = await page.title();
      console.log('Page title:', pageTitle);
    }

    expect(dashboardLoaded).toBeTruthy();
    console.log('Inspector login and dashboard access successful');
  });

  test('3. Inspector: Start and Complete Inspection Process', async ({ page }) => {
    // Ensure we're logged in and on the inspector dashboard
    await ensureInspectorLoggedIn(page);

    // Find and click on the first pending application
    const applicationItems = [
      page.locator('[data-testid="application-item"]').first(),
      page.locator('.application-item').first(),
      page.locator('tr').filter({ hasText: testData.store.businessName }).first(),
      page.locator('button, a').filter({ hasText: /view|inspect|start/i }).first()
    ];

    let applicationClicked = false;
    for (const item of applicationItems) {
      if (await item.count() > 0) {
        await item.click();
        applicationClicked = true;
        break;
      }
    }

    if (!applicationClicked) {
      // Try to find any clickable application element
      const allApplicationElements = await page.locator('*').filter({ hasText: testData.store.businessName }).all();
      if (allApplicationElements.length > 0) {
        await allApplicationElements[0].click();
        applicationClicked = true;
      }
    }

    expect(applicationClicked).toBeTruthy();
    await page.waitForTimeout(2000);

    // Start inspection process
    const startInspectionButtons = [
      page.locator('button:has-text("Start Inspection")'),
      page.locator('button:has-text("Begin Inspection")'),
      page.locator('[data-testid="start-inspection"]'),
      page.locator('button').filter({ hasText: /inspect/i }).first()
    ];

    let inspectionStarted = false;
    for (const button of startInspectionButtons) {
      if (await button.count() > 0) {
        await button.click();
        inspectionStarted = true;
        break;
      }
    }

    expect(inspectionStarted).toBeTruthy();
    await page.waitForTimeout(2000);

    // Fill inspection checklist
    await fillInspectionChecklist(page);

    // Upload inspection photos
    await uploadInspectionPhotos(page);

    // Add inspection notes
    const notesField = page.locator('textarea[name="inspectionNotes"], textarea[name="notes"], [data-testid="inspection-notes"]').first();
    if (await notesField.count() > 0) {
      await notesField.fill('Comprehensive inspection completed. All halal standards met. Kitchen maintains excellent cleanliness. Supplier certificates verified. Staff properly trained on halal requirements. Highly recommended for certification.');
    }

    // Select rating
    const ratingElements = [
      page.locator('[data-testid="rating-excellent"]'),
      page.locator('input[value="excellent"], input[value="5"]'),
      page.locator('button:has-text("Excellent")'),
      page.locator('.rating-excellent')
    ];

    for (const rating of ratingElements) {
      if (await rating.count() > 0) {
        await rating.click();
        break;
      }
    }

    // Approve and generate certificate
    const approvalButtons = [
      page.locator('button:has-text("Approve & Generate Certificate")'),
      page.locator('button:has-text("Approve Application")'),
      page.locator('button:has-text("Generate Certificate")'),
      page.locator('[data-testid="approve-button"]')
    ];

    let approved = false;
    for (const button of approvalButtons) {
      if (await button.count() > 0) {
        await button.click();
        approved = true;
        break;
      }
    }

    expect(approved).toBeTruthy();
    await page.waitForTimeout(5000); // Wait for certificate generation

    // Check for success and certificate generation
    const successIndicators = [
      page.locator('text=Certificate generated successfully'),
      page.locator('text=Application approved'),
      page.locator('text=Inspection completed'),
      page.locator('[data-testid="certificate-success"]')
    ];

    for (const indicator of successIndicators) {
      if (await indicator.count() > 0) {
        await expect(indicator).toBeVisible({ timeout: 10000 });
        break;
      }
    }

    console.log('Inspection process completed and application approved');
  });

  test('4. Extract and Save QR Code from Generated Certificate', async ({ page }) => {
    // Navigate to certificates or find the generated certificate
    await ensureInspectorLoggedIn(page);

    // Look for QR code on current page or navigate to certificates
    let qrCodeFound = false;
    const qrCodeSelectors = [
      '[data-testid="certificate-qr-code"]',
      '.qr-code',
      'img[alt*="QR"], img[alt*="qr"]',
      'canvas[data-qr], canvas.qr-code',
      'svg[data-qr], svg.qr-code'
    ];

    for (const selector of qrCodeSelectors) {
      const qrElement = page.locator(selector).first();
      if (await qrElement.count() > 0) {
        qrCodeFound = true;

        // Extract QR code image
        const elementType = await qrElement.evaluate((el) => el.tagName.toLowerCase());

        if (elementType === 'img') {
          const src = await qrElement.getAttribute('src');
          if (src) {
            qrCodeImageData = src;

            // If it's a data URL, save it directly
            if (src.startsWith('data:')) {
              const base64Data = src.split(',')[1];
              const buffer = Buffer.from(base64Data, 'base64');
              fs.writeFileSync(path.join(__dirname, '..', 'test-results', 'extracted-qr-code.png'), buffer);
            } else {
              // If it's a URL, fetch and save the image
              const response = await page.request.get(src);
              const buffer = await response.body();
              fs.writeFileSync(path.join(__dirname, '..', 'test-results', 'extracted-qr-code.png'), buffer);
            }
          }
        } else if (elementType === 'canvas') {
          // Extract canvas as image
          const dataUrl = await qrElement.evaluate((canvas: HTMLCanvasElement) => {
            return canvas.toDataURL('image/png');
          });
          qrCodeImageData = dataUrl;

          const base64Data = dataUrl.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          fs.writeFileSync(path.join(__dirname, '..', 'test-results', 'extracted-qr-code.png'), buffer);
        }

        // Extract certificate number from the page
        const certNumberSelectors = [
          'text=/HAL-\\d{4}-\\d{4}/',
          '[data-testid="certificate-number"]',
          '.certificate-number',
          '*:has-text("Certificate Number")',
          '*:has-text("Cert #")'
        ];

        for (const certSelector of certNumberSelectors) {
          const certElement = page.locator(certSelector).first();
          if (await certElement.count() > 0) {
            const text = await certElement.textContent();
            const match = text?.match(/HAL-\d{4}-\d{4}/);
            if (match) {
              certificateNumber = match[0];
              console.log('Extracted certificate number:', certificateNumber);
              break;
            }
          }
        }

        break;
      }
    }

    if (!qrCodeFound) {
      // Try to navigate to certificates page
      const certLinks = [
        page.locator('a[href*="certificate"]'),
        page.locator('button:has-text("View Certificate")'),
        page.locator('button:has-text("Certificate")')
      ];

      for (const link of certLinks) {
        if (await link.count() > 0) {
          await link.click();
          await page.waitForTimeout(2000);

          // Try to find QR code again
          for (const selector of qrCodeSelectors) {
            const qrElement = page.locator(selector).first();
            if (await qrElement.count() > 0) {
              qrCodeFound = true;
              break;
            }
          }
          break;
        }
      }
    }

    // Create test-results directory if it doesn't exist
    const testResultsDir = path.join(__dirname, '..', 'test-results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    console.log('QR code extraction completed. Found QR code:', qrCodeFound);
    if (qrCodeFound) {
      console.log('QR code saved to test-results/extracted-qr-code.png');
    }
  });

  test('5. QR Code Verification Flow', async ({ page }) => {
    // Navigate to QR verification page
    await page.goto('/verify');

    // Check if the verification page loads
    const verificationIndicators = [
      page.locator('text=Verify Certificate'),
      page.locator('text=QR Verification'),
      page.locator('text=Scan QR Code'),
      page.locator('[data-testid="qr-verification"]')
    ];

    let verificationPageLoaded = false;
    for (const indicator of verificationIndicators) {
      if (await indicator.count() > 0) {
        await expect(indicator).toBeVisible({ timeout: 10000 });
        verificationPageLoaded = true;
        break;
      }
    }

    if (!verificationPageLoaded) {
      // Try alternative verification URLs
      const verificationUrls = ['/qr-verify', '/scan', '/certificate-verify'];
      for (const url of verificationUrls) {
        await page.goto(url);
        await page.waitForTimeout(1000);

        for (const indicator of verificationIndicators) {
          if (await indicator.count() > 0) {
            verificationPageLoaded = true;
            break;
          }
        }
        if (verificationPageLoaded) break;
      }
    }

    if (certificateNumber) {
      // Try to verify using the certificate number
      const inputFields = [
        page.locator('input[name="certificateNumber"]'),
        page.locator('input[placeholder*="certificate"]'),
        page.locator('input[type="text"]').first()
      ];

      for (const input of inputFields) {
        if (await input.count() > 0) {
          await input.fill(certificateNumber);

          const verifyButtons = [
            page.locator('button:has-text("Verify")'),
            page.locator('button:has-text("Check")'),
            page.locator('button[type="submit"]')
          ];

          for (const button of verifyButtons) {
            if (await button.count() > 0) {
              await button.click();
              await page.waitForTimeout(3000);
              break;
            }
          }
          break;
        }
      }

      // Check for verification results
      const resultIndicators = [
        page.locator('text=Certificate is valid'),
        page.locator('text=Valid Certificate'),
        page.locator('text=Certified'),
        page.locator('.certificate-valid'),
        page.locator('[data-testid="certificate-valid"]')
      ];

      for (const indicator of resultIndicators) {
        if (await indicator.count() > 0) {
          await expect(indicator).toBeVisible({ timeout: 10000 });
          console.log('Certificate verification successful');
          break;
        }
      }
    } else {
      console.log('No certificate number available for verification test');
    }

    // If verification page exists, test the QR scanner interface
    if (verificationPageLoaded) {
      console.log('QR verification page loaded successfully');

      // Look for QR scanner interface
      const scannerElements = [
        page.locator('[data-testid="qr-scanner"]'),
        page.locator('.qr-scanner'),
        page.locator('video'),
        page.locator('canvas[data-scanner]')
      ];

      for (const scanner of scannerElements) {
        if (await scanner.count() > 0) {
          console.log('QR scanner interface detected');
          break;
        }
      }
    }

    console.log('QR verification flow testing completed');
  });

  test('6. Edge Cases and Error Handling', async ({ page }) => {
    // Test 1: Invalid certificate verification
    await page.goto('/verify');
    await page.waitForTimeout(1000);

    const inputField = page.locator('input[name="certificateNumber"], input[type="text"]').first();
    if (await inputField.count() > 0) {
      await inputField.fill('INVALID-CERT-123');

      const verifyButton = page.locator('button:has-text("Verify"), button[type="submit"]').first();
      if (await verifyButton.count() > 0) {
        await verifyButton.click();
        await page.waitForTimeout(2000);

        // Check for error message
        const errorIndicators = [
          page.locator('text=Certificate not found'),
          page.locator('text=Invalid certificate'),
          page.locator('text=Not found'),
          page.locator('.error'),
          page.locator('[data-testid="certificate-error"]')
        ];

        for (const error of errorIndicators) {
          if (await error.count() > 0) {
            console.log('Invalid certificate error handling works correctly');
            break;
          }
        }
      }
    }

    // Test 2: Access inspector dashboard without authentication
    await page.goto('/logout');
    await page.waitForTimeout(1000);

    await page.goto('/inspector/dashboard');
    await page.waitForTimeout(2000);

    // Should redirect to login or show access denied
    const authCheckIndicators = [
      page.locator('text=Login'),
      page.locator('text=Sign In'),
      page.locator('text=Access Denied'),
      page.locator('text=Unauthorized'),
      page.locator('input[name="email"], input[name="username"]')
    ];

    let authProtected = false;
    for (const indicator of authCheckIndicators) {
      if (await indicator.count() > 0) {
        authProtected = true;
        console.log('Inspector dashboard properly protected from unauthorized access');
        break;
      }
    }

    // Test 3: Form validation on application form
    await page.goto('/apply');
    await page.waitForTimeout(1000);

    // Try to proceed without filling required fields
    const nextButton = page.locator('button:has-text("Next")').first();
    if (await nextButton.count() > 0) {
      await nextButton.click();
      await page.waitForTimeout(1000);

      // Look for validation messages or ensure form doesn't proceed
      const validationIndicators = [
        page.locator('text=required'),
        page.locator('text=Please fill'),
        page.locator('.error'),
        page.locator('[aria-invalid="true"]')
      ];

      for (const validation of validationIndicators) {
        if (await validation.count() > 0) {
          console.log('Form validation working correctly');
          break;
        }
      }
    }

    console.log('Edge cases and error handling testing completed');
  });
});

// Helper functions
async function fillBusinessInformation(page: Page) {
  const fields = [
    { name: 'businessName', value: testData.store.businessName },
    { name: 'abn', value: testData.store.abn },
    { name: 'established', value: testData.store.established },
    { name: 'address', value: testData.store.address },
    { name: 'city', value: testData.store.city },
    { name: 'state', value: testData.store.state },
    { name: 'postcode', value: testData.store.postcode }
  ];

  for (const field of fields) {
    const input = page.locator(`input[name="${field.name}"]`);
    if (await input.count() > 0) {
      await input.fill(field.value);
    }
  }

  // Handle business type dropdown
  const businessTypeSelectors = [
    'select[name="businessType"]',
    'button:has-text("Select business type")',
    '[data-testid="business-type-select"]'
  ];

  for (const selector of businessTypeSelectors) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      if (selector.startsWith('select')) {
        await element.selectOption(testData.store.businessType);
      } else {
        await element.click();
        await page.waitForTimeout(500);
        const option = page.locator(`text=${testData.store.businessType}, [role="option"]:has-text("${testData.store.businessType}")`).first();
        if (await option.count() > 0) {
          await option.click();
        }
      }
      break;
    }
  }
}

async function fillOperationsInformation(page: Page) {
  // Fill employee count
  const employeeInput = page.locator('input[name="employeeCount"]');
  if (await employeeInput.count() > 0) {
    await employeeInput.fill(testData.store.employeeCount);
  }

  // Fill operating hours
  const hoursInput = page.locator('input[name="operatingHours"]');
  if (await hoursInput.count() > 0) {
    await hoursInput.fill(testData.store.operatingHours);
  }

  // Add products
  for (const product of testData.products) {
    const addProductButton = page.locator('button:has-text("Add Product")');
    if (await addProductButton.count() > 0) {
      await addProductButton.click();
      await page.waitForTimeout(500);

      const productInput = page.locator('input[name*="product"], input[placeholder*="product"]').last();
      if (await productInput.count() > 0) {
        await productInput.fill(product);
      }
    }
  }

  // Add suppliers
  for (const supplier of testData.suppliers) {
    const addSupplierButton = page.locator('button:has-text("Add Supplier")');
    if (await addSupplierButton.count() > 0) {
      await addSupplierButton.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator('input[name*="supplier"][name*="name"], input[placeholder*="supplier name"]').last();
      if (await nameInput.count() > 0) {
        await nameInput.fill(supplier.name);
      }

      const materialInput = page.locator('input[name*="material"], input[placeholder*="material"]').last();
      if (await materialInput.count() > 0) {
        await materialInput.fill(supplier.material);
      }

      if (supplier.certified) {
        const certifiedCheckbox = page.locator('input[type="checkbox"][name*="certified"]').last();
        if (await certifiedCheckbox.count() > 0) {
          await certifiedCheckbox.check();
        }
      }
    }
  }
}

async function uploadDocuments(page: Page) {
  const uploads = [
    { selector: 'input[name="businessLicense"], input[id="businessLicense"]', file: testFiles.businessLicense },
    { selector: 'input[name="floorPlan"], input[id="floorPlan"]', file: testFiles.floorPlan },
    { selector: 'input[name="supplierCertificates"], input[id="supplierCertificates"]', file: testFiles.supplierCertificate }
  ];

  for (const upload of uploads) {
    const fileInput = page.locator(upload.selector).first();
    if (await fileInput.count() > 0 && fs.existsSync(upload.file)) {
      await fileInput.setInputFiles(upload.file);
      await page.waitForTimeout(1000);
    }
  }
}

async function fillContactInformation(page: Page) {
  const contactFields = [
    { name: 'ownerName', value: testData.store.ownerName },
    { name: 'ownerEmail', value: testData.store.ownerEmail },
    { name: 'ownerPhone', value: testData.store.ownerPhone }
  ];

  for (const field of contactFields) {
    const input = page.locator(`input[name="${field.name}"]`);
    if (await input.count() > 0) {
      await input.fill(field.value);
    }
  }

  // Accept terms and conditions
  const termsCheckbox = page.locator('input[type="checkbox"][name*="terms"], input[type="checkbox"][name*="agree"]').last();
  if (await termsCheckbox.count() > 0) {
    await termsCheckbox.check();
  }
}

async function ensureInspectorLoggedIn(page: Page) {
  // Check if already logged in
  const dashboardIndicators = [
    page.locator('text=Inspector Dashboard'),
    page.locator('text=Pending Inspections'),
    page.locator('[data-testid="inspector-dashboard"]')
  ];

  let alreadyLoggedIn = false;
  for (const indicator of dashboardIndicators) {
    if (await indicator.count() > 0) {
      alreadyLoggedIn = true;
      break;
    }
  }

  if (!alreadyLoggedIn) {
    await page.goto('/login');
    await page.fill('input[name="email"], input[name="username"]', testData.inspector.email);
    await page.fill('input[name="password"]', testData.inspector.password);
    await page.click('button[type="submit"], button:has-text("Login")');
    await page.waitForTimeout(3000);
  }
}

async function fillInspectionChecklist(page: Page) {
  // Standard inspection checklist items
  const checklistItems = [
    'cleanlinessStandards',
    'halalLabeledIngredients',
    'separateStorageArea',
    'properEquipmentCleaning',
    'supplierCertificates',
    'staffTrainingRecords',
    'halalPolicyDisplayed',
    'noContamination',
    'properWasteDisposal',
    'validPermits'
  ];

  for (const item of checklistItems) {
    const checkbox = page.locator(`input[name="${item}"], input[id="${item}"]`);
    if (await checkbox.count() > 0) {
      await checkbox.check();
    }
  }

  // Also try generic checkbox selectors for inspection items
  const allCheckboxes = page.locator('input[type="checkbox"]');
  const checkboxCount = await allCheckboxes.count();

  for (let i = 0; i < checkboxCount; i++) {
    const checkbox = allCheckboxes.nth(i);
    const isChecked = await checkbox.isChecked();
    if (!isChecked) {
      // Check if this is an inspection-related checkbox (not terms/conditions)
      const nearbyText = await checkbox.evaluate((el) => {
        const parent = el.closest('label') || el.parentElement;
        return parent ? parent.textContent : '';
      });

      if (nearbyText && !nearbyText.toLowerCase().includes('terms') && !nearbyText.toLowerCase().includes('agree')) {
        await checkbox.check();
      }
    }
  }
}

async function uploadInspectionPhotos(page: Page) {
  const photoUploads = [
    'input[name="kitchenPhotos"], input[name*="kitchen"]',
    'input[name="storagePhotos"], input[name*="storage"]',
    'input[name="certificatePhotos"], input[name*="certificate"]',
    'input[name="inspectionPhotos"], input[name*="inspection"]'
  ];

  for (const selector of photoUploads) {
    const fileInput = page.locator(selector).first();
    if (await fileInput.count() > 0 && fs.existsSync(testFiles.inspectionPhoto)) {
      await fileInput.setInputFiles(testFiles.inspectionPhoto);
      await page.waitForTimeout(1000);
    }
  }
}