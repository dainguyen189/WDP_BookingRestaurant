import React from 'react';
import { Form } from 'react-bootstrap';
import './Input.css';

const Input = ({ label, isInvalid, feedbackMsg, className, ...props }) => {
    return (
        <Form.Group className={`mb-3 custom-input ${className || ''}`}>
            {label && <Form.Label>{label}</Form.Label>}
            {/* Thêm style inline để đảm bảo input hiển thị */}
            <Form.Control
                className="custom-form-control"
                isInvalid={isInvalid}
                style={{ display: 'block', width: '100%' }}
                {...props}
            />
            {isInvalid && (
                <Form.Control.Feedback type="invalid">
                    {feedbackMsg || "This field is required"}
                </Form.Control.Feedback>
            )}
        </Form.Group>
    );
};

export default Input;