import React, { useState, useRef, useEffect } from "react";
import { FaComments, FaPaperPlane, FaTimes } from "react-icons/fa";
import "./css/FloatingChat.css"; // tạo file CSS riêng bên dưới
import axiosInstance from "../../utils/axiosConfig";

const FloatingChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Tự động scroll xuống khi có tin nhắn mới
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = { sender: "user", text: input };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await axiosInstance.post("/chatbot", {
                prompt: input,
            });
            const botMsg = { sender: "bot", text: res.data.reply };
            setMessages((prev) => [...prev, botMsg]);
        } catch (err) {
            console.error(err);
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Xin lỗi, tôi gặp chút sự cố. Vui lòng thử lại sau nhé!" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatbot-widget">
            {/* Nút mở/đóng chat */}
            {!isOpen ? (
                <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
                    <FaComments size={22} />
                </button>
            ) : (
                <div className="chatbot-box">
                    <div className="chatbot-header">
                        <h6>Trợ lý nhà hàng</h6>
                        <button onClick={() => setIsOpen(false)}><FaTimes /></button>
                    </div>

                    <div className="chatbot-body">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`chat-msg ${msg.sender === "user" ? "user" : "bot"}`}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {loading && <div className="chat-loading">Đang trả lời...</div>}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="chatbot-footer">
                        <input
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        />
                        <button onClick={handleSend}><FaPaperPlane /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FloatingChat;