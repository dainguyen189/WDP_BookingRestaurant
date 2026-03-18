const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const invoiceSchema = new Schema({
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customer_id: { type: Schema.Types.ObjectId, ref: 'Customer' },
    invoice_date: { type: Date, default: Date.now },
    total_amount: { type: Number, required: true }, 
    discount: { type: Number, default: 0 }, 
    tax_amount: { type: Number, default: 0 },
    payment_method: { type: String, default: 'qr_code', required: true },
    payment_status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
});
const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = Invoice;