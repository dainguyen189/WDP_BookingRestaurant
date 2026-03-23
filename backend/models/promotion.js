const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    discount_type: {
        type: String,
        enum: ['percentage', 'fixed_amount'],
        required: true
    },
    discount_value: { type: Number, required: true },
    points_required: {
        type: Number,
        default: 0
    },
    min_order_value: {
        type: Number,
        default: 0
    },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: false },
    min_order_amount: { type: Number, default: 0 },
    /** 0 = không giới hạn lượt dùng */
    usage_limit: { type: Number, default: 0 },
    used_count: { type: Number, default: 0 },
    promotion_type: {
        type: String,
        enum: ['general', 'points_based'],
        default: 'general',
    },
});

module.exports = mongoose.models.Promotion || mongoose.model('Promotion', PromotionSchema);