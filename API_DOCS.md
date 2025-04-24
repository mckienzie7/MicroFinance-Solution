# MicroFinance Solution API Documentation

## Overview
The **MicroFinance Solution API** provides a secure and efficient way to manage microfinance operations, including user authentication, loan management, and transaction tracking. This documentation outlines the available endpoints, request/response formats, and authentication requirements.

## Base URL
```
https://api.microfinance-solution.com/api/v1
```

## Authentication
The API uses **JWT Authentication** for securing endpoints. Users must include the `Authorization` header in their requests.

Example:
```
Authorization: Bearer <your_token>
```

---

## Endpoints

### 1. User Management

#### **1.1 Register User**
**POST** `/users/register`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword",
  "username": "mnasd",
  "admin" : True or False
}
```

**Response:**
```json
{
  "id": "12345",
  "email": "john.doe@example.com",
  "message": "User registered successfully"
}
```

#### **1.2 User Login**
**POST** `/users/login`

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJI...",
  "user_id": "12345"
}
```

---

### 2. Loan Management

#### **2.1 Apply for a Loan**
**POST** `/loans/apply`

**Request Body:**
```json
{
  "user_id": "12345",
  "amount": 5000,
  "duration": 12,
  "purpose": "Business Expansion"
}
```

**Response:**
```json
{
  "loan_id": "L-001",
  "status": "pending",
  "message": "Loan application submitted successfully"
}
```

#### **2.2 Get Loan Details**
**GET** `/loans/{loan_id}`

**Response:**
```json
{
  "loan_id": "L-001",
  "user_id": "12345",
  "amount": 5000,
  "duration": 12,
  "status": "approved",
  "remaining_balance": 4500
}
```

---

### 3. Transactions

#### **3.1 Make a Payment**
**POST** `/payments`

**Request Body:**
```json
{
  "user_id": "12345",
  "loan_id": "L-001",
  "amount": 500
}
```

**Response:**
```json
{
  "transaction_id": "T-001",
  "status": "success",
  "message": "Payment processed successfully"
}
```

#### **3.2 Get Payment History**
**GET** `/payments/{user_id}`

**Response:**
```json
[
  {
    "transaction_id": "T-001",
    "loan_id": "L-001",
    "amount": 500,
    "date": "2024-03-13"
  },
  {
    "transaction_id": "T-002",
    "loan_id": "L-001",
    "amount": 500,
    "date": "2024-04-13"
  }
]
```

---

## Error Handling
All error responses follow this format:
```json
{
  "error": "Invalid credentials",
  "code": 401
}
```

Common error codes:
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (invalid token)
- **404**: Not Found (resource does not exist)
- **500**: Internal Server Error

---

## Conclusion
This API documentation serves as a guide for integrating with the **MicroFinance Solution API**. For additional support, please contact the development team.

