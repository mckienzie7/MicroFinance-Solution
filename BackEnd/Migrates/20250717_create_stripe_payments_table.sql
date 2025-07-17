-- Create stripe_payments table
CREATE TABLE IF NOT EXISTS stripe_payments (
    id VARCHAR(60) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    user_id VARCHAR(60) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    stripe_charge_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (stripe_charge_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

