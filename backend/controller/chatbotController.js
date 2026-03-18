const { GoogleGenerativeAI } = require("@google/generative-ai");

const ai = new GoogleGenerativeAI(process.env.GENEMI_API_KEY);

// Prompt hệ thống (đóng vai trợ lý ảo)
const systemPrompt = `
Bạn là trợ lý ảo thân thiện của *Nhà hàng *.
Nhiệm vụ của bạn là:
- Giới thiệu các món ăn nổi bật, thực đơn và món đặc trưng của nhà hàng.
- Hỗ trợ khách đặt bàn, tra cứu khuyến mãi và giờ mở cửa.
- Tư vấn món ăn phù hợp theo khẩu vị (mặn, cay, chay, hải sản, v.v.).
- Luôn trả lời ngắn gọn, thân thiện, dễ hiểu, và đúng phong cách phục vụ chuyên nghiệp.

Nếu câu hỏi không liên quan đến nhà hàng (như hỏi chính trị, toán học, v.v.), hãy lịch sự trả lời rằng bạn chỉ hỗ trợ các vấn đề liên quan đến Nhà hàng.
`;

exports.chatWithBot = async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        // Tạo prompt hoàn chỉnh
        const fullPrompt = `
${systemPrompt}

Khách: ${prompt}
Bot:
`;

        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(fullPrompt);
        const reply = result.response.text();

        res.json({ reply });
    } catch (error) {
        console.error("❌ Chatbot error:", error);
        res.status(500).json({ error: error.message });
    }
};
