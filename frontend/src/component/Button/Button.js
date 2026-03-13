import React from 'react';
import { Button as BootstrapButton } from 'react-bootstrap';
import './Button.css';

const Button = ({ children, variant = "primary", fullWidth, ...props }) => {
    const className = `custom-button ${fullWidth ? 'w-100' : ''}`;

    return (
        <BootstrapButton
            variant={variant}
            className={className}
            {...props}
        >
            {children}
        </BootstrapButton>
    );
};

export default Button;