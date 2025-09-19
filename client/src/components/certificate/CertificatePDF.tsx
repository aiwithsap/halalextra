import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 11,
    padding: 40,
    backgroundColor: '#ffffff',
    color: '#333333',
  },
  border: {
    border: '4pt solid #085a49',
    borderRadius: '8pt',
    padding: 30,
    height: '100%',
    position: 'relative',
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#085a49',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  certificateBody: {
    textAlign: 'center',
    marginBottom: 40,
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  storeAddress: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 20,
  },
  declaration: {
    fontSize: 12,
    color: '#333333',
    fontStyle: 'italic',
    marginHorizontal: 40,
    marginBottom: 25,
    lineHeight: 1.4,
  },
  certificateNumber: {
    fontSize: 14,
    fontFamily: 'Courier',
    backgroundColor: '#f5f5f5',
    padding: 8,
    border: '1pt solid #cccccc',
    borderRadius: '4pt',
    marginBottom: 30,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  dateItem: {
    textAlign: 'center',
  },
  dateLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
  },
  qrSection: {
    textAlign: 'center',
    borderTop: '1pt solid #e0e0e0',
    paddingTop: 25,
  },
  qrText: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 15,
  },
  qrImage: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
    border: '1pt solid #e0e0e0',
    borderRadius: '4pt',
  },
  verificationText: {
    fontSize: 9,
    color: '#999999',
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 72,
    color: '#085a49',
    transform: 'rotate(-45deg)',
  },
});

interface CertificatePDFProps {
  certificate: {
    id: string;
    storeName: string;
    storeAddress: string;
    status: string;
    certificateNumber: string;
    issuedDate: string;
    expiryDate: string;
    qrCodeUrl: string;
  };
}

// Format dates for PDF display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(date);
};

const CertificatePDF: React.FC<CertificatePDFProps> = ({ certificate }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.border}>
        {/* Watermark */}
        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>HALAL</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Official Halal Certificate</Text>
          <Text style={styles.subtitle}>Halal Certification Authority</Text>
        </View>

        {/* Certificate Body */}
        <View style={styles.certificateBody}>
          <Text style={styles.storeName}>{certificate.storeName}</Text>
          <Text style={styles.storeAddress}>{certificate.storeAddress}</Text>
          
          <Text style={styles.declaration}>
            This is to certify that the above-mentioned establishment complies with 
            the Halal standards and requirements as prescribed by the Islamic dietary laws. 
            This certificate is valid for the period specified below.
          </Text>
          
          <Text style={styles.certificateNumber}>
            Certificate No: {certificate.certificateNumber}
          </Text>
        </View>

        {/* Date Section */}
        <View style={styles.dateSection}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Issued Date</Text>
            <Text style={styles.dateValue}>{formatDate(certificate.issuedDate)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Expiry Date</Text>
            <Text style={styles.dateValue}>{formatDate(certificate.expiryDate)}</Text>
          </View>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <Text style={styles.qrText}>Scan QR Code to Verify Certificate</Text>
          {certificate.qrCodeUrl && (
            <Image
              src={certificate.qrCodeUrl}
              style={styles.qrImage}
            />
          )}
          <Text style={styles.verificationText}>
            Visit our website or scan this code to verify the authenticity of this certificate
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default CertificatePDF;