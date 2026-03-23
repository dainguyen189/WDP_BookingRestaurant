const createError = require("../util/errorHandle")
const Promotion = require("../models/promotion");
const User = require("../models/user");


const getAllPromotions = async (req, res, next) => {
    try {
        const promotions = await Promotion.find();
        res.status(200).json(promotions);
    } catch (error) {
        next(createError(500, "fail to get promotions"))
    }
}

const parseUsageLimit = (raw) => {
    if (raw === undefined || raw === null || raw === '') return 0;
    const n = parseInt(String(raw), 10);
    if (isNaN(n) || n < 0) return 0;
    return n;
};

const createPromotion = async (req, res, next) => {
    try {
        const {
            code,
            description,
            discount_type,
            discount_value,
            points_required,
            min_order_value,
            start_date,
            end_date,
            promotion_type,
            usage_limit,
            is_active,
        } = req.body;


        if (!code || !description || !discount_type || discount_value === undefined || discount_value === '' || !start_date || !end_date) {
            return next(createError(400, "Missing required fields"));
        }



        const discountVal = parseFloat(discount_value);
        if (isNaN(discountVal) || discountVal <= 0) {
            return next(createError(400, "Invalid discount value"));
        }


        if (discount_type === 'percentage' && discountVal > 100) {
            return next(createError(400, "Percentage discount cannot exceed 100%"));
        }


        const checkCodeDuplicate = await Promotion.findOne({ code: code.toUpperCase() });
        if (checkCodeDuplicate) {
            return next(createError(400, "Promotion code already exists"));
        }


        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return next(createError(400, "Invalid date format"));
        }

        if (startDate >= endDate) {
            return next(createError(400, "End date must be after start date"));
        }

        const minVal = parseFloat(min_order_value) || 0;
        const newPromotion = new Promotion({
            code: code.toUpperCase(),
            description,
            discount_type,
            discount_value: discountVal,
            points_required: parseInt(points_required, 10) || 0,
            min_order_value: minVal,
            min_order_amount: minVal,
            start_date: startDate,
            end_date: endDate,
            is_active: is_active !== undefined ? Boolean(is_active) : true,
            usage_limit: parseUsageLimit(usage_limit),
            used_count: 0,
            promotion_type: ['general', 'points_based'].includes(promotion_type) ? promotion_type : 'general',
        });

        const savedPromotion = await newPromotion.save();
        res.status(201).json({
            success: true,
            message: "Promotion created successfully",
            data: savedPromotion
        });
    } catch (err) {
        console.error("Error creating promotion:", err);
        next(createError(500, "Failed to create promotion"));
    }
};

const updatePromotion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            code,
            description,
            discount_type,
            discount_value,
            points_required,
            min_order_value,
            start_date,
            end_date,
            is_active,
            usage_limit,
            promotion_type,
        } = req.body;

        const existing = await Promotion.findById(id);
        if (!existing) {
            return next(createError(404, "Promotion not found"));
        }

        if (!code || !description || !discount_type || discount_value === undefined || discount_value === '' || !start_date || !end_date) {
            return next(createError(400, "Missing required fields"));
        }

        const discountVal = parseFloat(discount_value);
        if (isNaN(discountVal) || discountVal <= 0) {
            return next(createError(400, "Invalid discount value"));
        }
        if (discount_type === 'percentage' && discountVal > 100) {
            return next(createError(400, "Percentage discount cannot exceed 100%"));
        }

        const codeUpper = String(code).toUpperCase();
        if (codeUpper !== existing.code) {
            const dup = await Promotion.findOne({ code: codeUpper, _id: { $ne: id } });
            if (dup) {
                return next(createError(400, "Promotion code already exists"));
            }
        }

        const startDateObj = new Date(start_date);
        const endDateObj = new Date(end_date);
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return next(createError(400, "Invalid date format"));
        }
        if (startDateObj >= endDateObj) {
            return next(createError(400, "End date must be after start date"));
        }

        const minVal = parseFloat(min_order_value) || 0;
        const newUsageLimit = parseUsageLimit(usage_limit);
        if (newUsageLimit > 0 && (existing.used_count || 0) > newUsageLimit) {
            return next(createError(400, "Giới hạn lượt dùng không được nhỏ hơn số lượt đã sử dụng"));
        }

        const updatedPromotion = await Promotion.findByIdAndUpdate(
            id,
            {
                code: codeUpper,
                description,
                discount_type,
                discount_value: discountVal,
                points_required: parseInt(points_required, 10) || 0,
                min_order_value: minVal,
                min_order_amount: minVal,
                start_date: startDateObj,
                end_date: endDateObj,
                is_active: Boolean(is_active),
                usage_limit: newUsageLimit,
                promotion_type: ['general', 'points_based'].includes(promotion_type) ? promotion_type : 'general',
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Promotion updated successfully",
            data: updatedPromotion,
        });
    } catch (err) {
        console.error("Error updating promotion:", err);
        if (err.code === 11000) {
            return next(createError(400, "Promotion code already exists"));
        }
        next(createError(500, err.message || "Failed to update promotion"));
    }
}

const deletePromotion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedPromotion = await Promotion.findByIdAndDelete(id);
        if (!deletedPromotion) {
            return next(createError(404, "Promotion not found"));
        }
        res.status(204).json({ message: "Promotion deleted successfully" });
    } catch (error) {
        next(createError(500, "Failed to delete promotion"));

    }
}


const convertPointsToPromotion = async (req, res, next) => {
    try {
        const { userId, voucherCode } = req.body;
        if (!userId || !voucherCode) {
            return next(createError(400, "User ID and Voucher Code are required."));
        }
        
        const user = await User.findById(userId);
        const promotion = await Promotion.findOne({ code: voucherCode });

        if (!user) {
            return next(createError(404, "User not found"));
        }
        if (!promotion) {
            return next(createError(404, "Voucher not found"));
        }

        const pointsToConvert = promotion.points_required;
        
        if (user.points < pointsToConvert) {
            return next(createError(400, "Insufficient points"));
        }

        user.points -= pointsToConvert;

        if (!user.vouchers.includes(promotion._id)) {
            user.vouchers.push(promotion._id);
        }

        const updatedUser = await user.save();

        res.status(200).json({
            success: true,
            message: 'Đổi điểm thành voucher thành công!',
            user: updatedUser, 
        });

    } catch (err) {
        console.error("Error in convertPointsToPromotion:", err);
        next(createError(500, "Failed to convert points to promotion: " + err.message));
    }
};
const addPointsAfterPayment = async (req, res, next) => {
    try {
        const { userId, totalAmount } = req.body;


        if (!userId || !totalAmount || totalAmount <= 0) {
            return next(createError(400, "Missing required fields: userId, totalAmount"));
        }

        const user = await User.findById(userId);
        if (!user) {
            return next(createError(404, "User not found"));
        }

        // 1000 VND = 1 point
        const pointsEarned = Math.floor(totalAmount / 1000);

        // Check if negative points
        if (pointsEarned <= 0) {
            return res.status(200).json({
                success: true,
                message: 'Order value too low to earn points',
                pointsEarned: 0,
                totalPoints: user.points
            });
        }


        user.points += pointsEarned;




        await user.save();

        res.status(200).json({
            success: true,
            message: `Successfully added ${pointsEarned} points`,
            pointsEarned,
            totalPoints: user.points,
            conversion: `${totalAmount.toLocaleString('vi-VN')}₫ → ${pointsEarned} points`
        });
    } catch (err) {
        console.error("Error adding points:", err);
        next(createError(500, "Failed to add points: " + err.message));
    }
};

const getActivePromotions = async (req, res, next) => {
    try {
        const now = new Date();
        const activePromotions = await Promotion.find({
            is_active: true,
            start_date: { $lte: now },
            end_date: { $gte: now },
        });

        res.status(200).json({
            success: true,
            count: activePromotions.length,
            data: activePromotions,
        });
    } catch (error) {
        console.error("Error fetching active promotions:", error);
        next(createError(500, "Failed to fetch active promotions."));
    }
};

const applyVoucher = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { voucherCode } = req.body;

        if (!voucherCode) {
            return next(createError(400, "Voucher code is required."));
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return next(createError(404, "Order not found."));
        }
        if (order.promotion_id) {
            return next(createError(400, "A promotion has already been applied to this order."));
        }

        const promotion = await Promotion.findOne({
            code: voucherCode.toUpperCase(),
            is_active: true,
            start_date: { $lte: new Date() },
            end_date: { $gte: new Date() },
        });

        if (!promotion) {
            return next(createError(404, "Voucher code is invalid or has expired."));
        }

        const items = await OrderItem.find({ orderId: orderId });
        const subTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (subTotal < promotion.min_order_value) {
            return next(createError(400, `Order total must be at least ${promotion.min_order_value.toLocaleString('vi-VN')}₫ to apply this voucher.`));
        }

        let discountAmount = 0;
        if (promotion.discount_type === 'percentage') {
            discountAmount = subTotal * (promotion.discount_value / 100);
        } else {
            discountAmount = promotion.discount_value;
        }

        order.totalAmount = Math.max(0, subTotal - discountAmount);
        order.promotion_id = promotion._id;

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Voucher applied successfully!',
            data: {
                orderId: order._id,
                subTotal,
                discount: discountAmount,
                newTotalAmount: order.totalAmount,
            },
        });
    } catch (error) {
        next(createError(500, "Failed to apply voucher."));
    }
};



module.exports = {
    getAllPromotions,
    createPromotion,
    updatePromotion,
    convertPointsToPromotion,
    getActivePromotions,
    applyVoucher,
    deletePromotion,
    addPointsAfterPayment,
}
