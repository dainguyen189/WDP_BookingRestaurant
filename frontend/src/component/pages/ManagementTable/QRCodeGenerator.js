import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './QRCodeComponent.css';

function QRCodeComponent({ sessionId }) {
  const qrRef = useRef();
  const url = `http://localhost:3000/menu?sessionId=${sessionId}`;

  const handlePrint = async () => {
    const canvasElement = qrRef.current.querySelector('canvas');
    const imgData = canvasElement.toDataURL('image/png');

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const imgProps = doc.getImageProperties(imgData);
    const pageWidth = doc.internal.pageSize.getWidth();
    const imgWidth = Math.min(imgProps.width, pageWidth * 0.8);
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    doc.setFontSize(16);
    doc.text('QR Code for Guests', pageWidth / 2, 40, { align: 'center' });
    doc.addImage(imgData, 'PNG', (pageWidth - imgWidth) / 2, 60, imgWidth, imgHeight);
    doc.text(`Session ID: ${sessionId}`, pageWidth / 2, 60 + imgHeight + 30, { align: 'center' });
    
    doc.save(`QR-${sessionId}.pdf`);
  };

  return (
    <div className="qr-popup-content">
      <div ref={qrRef}>
        <h3 className="qr-title">📱 QR Code </h3>
        <QRCodeCanvas value={url} size={200} />
        <p className="qr-subtitle">Quét để xem thực đơn</p>
        <p className="session-text"><strong>Session ID:</strong> {sessionId}</p>
        </div>
      <button onClick={handlePrint} className="qr-print-button">🖨️ Print QR </button>
    </div>
  );
}

export default QRCodeComponent;
