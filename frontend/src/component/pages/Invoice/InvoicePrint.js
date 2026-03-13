import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './InvoicePrint.css';

function PrintableInvoice() {
    const { orderId } = useParams();
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [discount, setDiscount] = useState(0);
    useEffect(() => {
        if (!orderId) {
            setError('Order ID is missing from the URL.');
            setLoading(false);
            return;
        }

        const fetchInvoice = async () => {
            try {
                const res = await axios.get(`http://localhost:8080/api/invoices/by-order/${orderId}`);
                if (res.data.success) {
                    setInvoiceData(res.data.data);
                } else {
                    setError(res.data.message || 'Failed to fetch invoice data.');
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Could not connect to the server.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [orderId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div className="print-loading">Loading Invoice...</div>;
    if (error) return <div className="print-error">{error}</div>;
    if (!invoiceData) return <div className="print-error">No invoice data found for this order.</div>;

    const { invoice, items } = invoiceData;

    return (
        <div className="invoice-wrapper">
            <div className="invoice-box">
                <h1 className="invoice-header">RESTAURANT INVOICE</h1>
                <p><strong>Invoice ID:</strong> {invoice._id}</p>
                <p><strong>Order ID:</strong> {invoice.order_id._id}</p>
                <p><strong>Date:</strong> {new Date(invoice.invoice_date).toLocaleString('en-US')}</p>
                <hr />
                <table className="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item._id}>
                                <td>{item.menuItemId?.name || 'Unknown Item'}</td>
                                <td>{item.quantity}</td>
                                <td>{item.price.toLocaleString('en-US')}₫</td>
                                <td>{(item.price * item.quantity).toLocaleString('en-US')}₫</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <hr />
                <div className="invoice-summary">
                    <p><strong>Subtotal:</strong> {invoice.total_amount.toLocaleString('en-US')}₫</p>
                    <p><strong>Discount:</strong> {invoice.discount.toLocaleString('en-US')}₫</p>
                    <h3 className="grand-total">
                        <strong>Grand Total: {invoice.total_amount.toLocaleString('en-US')}₫</strong>
                    </h3>
                </div>
                <p className="thank-you-note">Thank you for your visit!</p>
            </div>
            <div className="print-controls">
                <Link to="/cashier/tables" className="btn-back">Back to Tables</Link>
                <button onClick={handlePrint} className="btn-print">Print Invoice</button>
            </div>
        </div>
    );
}

export default PrintableInvoice;
