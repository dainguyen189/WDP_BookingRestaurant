import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

function TestQRCode() {
  const [testUrl, setTestUrl] = useState('https://www.google.com');
  const [qrSize, setQrSize] = useState(256);
  const [testResult, setTestResult] = useState(null);
  const [macTestResult, setMacTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [macLoading, setMacLoading] = useState(false);

  const testZaloPayConnection = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing ZaloPay connection...');
      const response = await axios.get('http://localhost:8080/api/zalopay/test-orders');
      console.log('📥 Test response:', response.data);
      setTestResult(response.data);
    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResult({
        success: false,
        error: error.message,
        response: error.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  const testMacSignature = async () => {
    setMacLoading(true);
    try {
      console.log('🔐 Testing MAC signature generation...');
      const response = await axios.get('http://localhost:8080/api/zalopay/test-mac');
      console.log('📥 MAC test response:', response.data);
      setMacTestResult(response.data);
    } catch (error) {
      console.error('❌ MAC test failed:', error);
      setMacTestResult({
        success: false,
        error: error.message,
        response: error.response?.data
      });
    } finally {
      setMacLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🧪 QR Code & ZaloPay Test</h2>
      
      {/* QR Code Test */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>📱 QR Code Generation Test</h3>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Test URL: 
            <input 
              type="text" 
              value={testUrl} 
              onChange={(e) => setTestUrl(e.target.value)}
              style={{ width: '300px', marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            QR Size: 
            <input 
              type="number" 
              value={qrSize} 
              onChange={(e) => setQrSize(parseInt(e.target.value))}
              style={{ width: '100px', marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        
        <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #eee', borderRadius: '4px' }}>
          <QRCodeSVG 
            value={testUrl} 
            size={qrSize} 
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#000000"
          />
          <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            URL: {testUrl}
          </p>
        </div>
      </div>

      {/* MAC Signature Test */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🔐 MAC Signature Test</h3>
        <button 
          onClick={testMacSignature}
          disabled={macLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: macLoading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: macLoading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {macLoading ? 'Testing...' : 'Test MAC Signature'}
        </button>

        {macTestResult && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: macTestResult.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${macTestResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px'
          }}>
            <h4>{macTestResult.success ? '✅ MAC Test Successful' : '❌ MAC Test Failed'}</h4>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px',
              fontSize: '12px'
            }}>
              {JSON.stringify(macTestResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* ZaloPay Test */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>🔗 ZaloPay Connection Test</h3>
        <button 
          onClick={testZaloPayConnection}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test ZaloPay Connection'}
        </button>

        {testResult && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: testResult.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${testResult.success ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px'
          }}>
            <h4>{testResult.success ? '✅ Test Successful' : '❌ Test Failed'}</h4>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px',
              fontSize: '12px'
            }}>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>📋 Troubleshooting Steps</h3>
        <ol>
          <li><strong>QR Code Test:</strong> If the QR code above doesn't display, there's an issue with the qrcode.react library</li>
          <li><strong>ZaloPay Test:</strong> Click the test button to check if there are orders in the database</li>
          <li><strong>Check Console:</strong> Open browser developer tools to see detailed error messages</li>
          <li><strong>API Status:</strong> Make sure the backend server is running on port 8080</li>
          <li><strong>Database:</strong> Ensure MongoDB is running and has some test data</li>
        </ol>
      </div>
    </div>
  );
}

export default TestQRCode;
