# Libro License Server - Complete Implementation Guide

## Overview

This guide provides complete specifications for building the license validation server that the Libro Library Management System's AppManager module communicates with. The server handles license activation, validation, and organization management.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Business Logic](#business-logic)
5. [Security Requirements](#security-requirements)
6. [Implementation Examples](#implementation-examples)
7. [Admin Portal Features](#admin-portal-features)
8. [Testing Guide](#testing-guide)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Libro Desktop App                            │
│                      (Qt/QML + C++)                             │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ AppManager  │───▶│   Network   │───▶│   HTTPS    │          |
│  │  (Client)   │    │   Request   │    │   POST      │          │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    License Server                               │
│                 (libro.yoursite.com)                            │
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   API       │───▶│  Business   │───▶│  Database   │         │
│  │  Routes     │    │   Logic     │    │  (MySQL/    │         │
│  │             │    │             │    │  PostgreSQL)│         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Admin Web Portal                        │       │
│  │  - Manage organizations                              │       │
│  │  - Generate license keys                             │       │
│  │  - View activation logs                              │       │
│  │  - Handle renewals                                   │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack Options

| Component | Options |
|-----------|---------|
| Backend Framework | Node.js/Express, Python/FastAPI, PHP/Laravel, .NET Core |
| Database | MySQL 8+, PostgreSQL 14+, MariaDB 10+ |
| Cache (Optional) | Redis for rate limiting and session management |
| Web Server | Nginx, Apache |
| SSL | Let's Encrypt, Cloudflare |

---

## Database Schema

### Complete SQL Schema (MySQL/MariaDB)

```sql
-- ============================================
-- LIBRO LICENSE SERVER DATABASE SCHEMA
-- ============================================

-- Organizations table (customers/libraries)
CREATE TABLE organizations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id VARCHAR(20) NOT NULL UNIQUE,  -- Format: ORG-XXXXX
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    INDEX idx_org_id (organization_id),
    INDEX idx_email (email)
);

-- Subscription tiers definition
CREATE TABLE subscription_tiers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tier_code VARCHAR(20) NOT NULL UNIQUE,  -- 'trial', 'basic', 'premium'
    tier_name VARCHAR(50) NOT NULL,
    description TEXT,
    max_users INT DEFAULT NULL,              -- NULL = unlimited
    max_books INT DEFAULT NULL,              -- NULL = unlimited
    features JSON,                           -- Feature flags as JSON
    monthly_price DECIMAL(10, 2),
    annual_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert default tiers
INSERT INTO subscription_tiers (tier_code, tier_name, description, max_users, max_books, monthly_price, annual_price, features) VALUES
('trial', 'Trial', '7-day free trial with full features', NULL, NULL, 0.00, 0.00, '{"all_features": true, "support": "email"}'),
('basic', 'Basic', 'Essential library management features', 50, 10000, 29.99, 299.99, '{"circulation": true, "catalog": true, "reports_basic": true, "opac": true, "support": "email"}'),
('premium', 'Premium', 'Full-featured library management', NULL, NULL, 79.99, 799.99, '{"circulation": true, "catalog": true, "reports_advanced": true, "opac": true, "email_notifications": true, "api_access": true, "support": "priority"}');

-- Licenses table (one per organization, can have history)
CREATE TABLE licenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    license_key VARCHAR(50) NOT NULL UNIQUE,  -- Format: XXXX-XXXX-XXXX-XXXX
    tier_id INT NOT NULL,
    activation_date DATE,
    expiry_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES subscription_tiers(id),
    
    INDEX idx_license_key (license_key),
    INDEX idx_org_license (organization_id, is_active),
    INDEX idx_expiry (expiry_date)
);

-- License activations log (tracks each activation attempt)
CREATE TABLE license_activations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    license_id INT NOT NULL,
    activation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    machine_identifier VARCHAR(255),         -- Optional: track which machines
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    request_data JSON,
    
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE,
    
    INDEX idx_license_activations (license_id, activation_time)
);

-- License validations log (tracks periodic validations)
CREATE TABLE license_validations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    license_id INT NOT NULL,
    validation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    validation_result ENUM('valid', 'expired', 'revoked', 'invalid') NOT NULL,
    response_sent JSON,
    
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE,
    
    INDEX idx_license_validations (license_id, validation_time)
);

-- Payments/Transactions (for tracking renewals)
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    license_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    notes TEXT,
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (license_id) REFERENCES licenses(id),
    
    INDEX idx_org_payments (organization_id, payment_date)
);

-- Admin users (for the web portal)
CREATE TABLE admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role ENUM('super_admin', 'admin', 'support') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Audit log (for admin actions)
CREATE TABLE audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_user_id) REFERENCES admin_users(id),
    
    INDEX idx_audit_time (created_at),
    INDEX idx_audit_entity (entity_type, entity_id)
);
```

### PostgreSQL Version

```sql
-- Same structure, but with PostgreSQL-specific syntax

CREATE TYPE validation_result_enum AS ENUM ('valid', 'expired', 'revoked', 'invalid');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'admin', 'support');

-- Organizations table
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    organization_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    contact_person VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Continue with other tables following same pattern...
```

---

## API Endpoints

### Base URL
```
https://libro.yoursite.com/api/v1
```

### Authentication
All API requests from the desktop app include:
- `organization_id` - The organization's unique ID
- `license_key` - The license key for verification

### Endpoint 1: License Activation

**POST** `/license/activate`

This endpoint is called when a user first enters their Organization ID and License Key in the desktop app.

#### Request

```http
POST /api/v1/license/activate HTTP/1.1
Host: libro.yoursite.com
Content-Type: application/json

{
    "organization_id": "ORG-12345",
    "license_key": "ABCD-EFGH-IJKL-MNOP"
}
```

#### Response - Success (200 OK)

```json
{
    "success": true,
    "message": "License activated successfully",
    "license": {
        "tier": "premium",
        "tier_name": "Premium",
        "activation_date": "2026-01-25",
        "expiry_date": "2027-01-25",
        "features": {
            "circulation": true,
            "catalog": true,
            "reports_advanced": true,
            "opac": true,
            "email_notifications": true,
            "api_access": true,
            "support": "priority"
        }
    },
    "organization": {
        "name": "Springfield Public Library",
        "location": "Springfield, IL",
        "address": "123 Main Street, Springfield, IL 62701",
        "phone": "+1 (217) 555-0100",
        "email": "library@springfield.gov"
    }
}
```

#### Response - Invalid Credentials (401 Unauthorized)

```json
{
    "success": false,
    "error": "invalid_credentials",
    "message": "The Organization ID or License Key is incorrect. Please check and try again."
}
```

#### Response - License Expired (403 Forbidden)

```json
{
    "success": false,
    "error": "license_expired",
    "message": "This license has expired. Please renew your subscription.",
    "expiry_date": "2025-12-31"
}
```

#### Response - License Revoked (403 Forbidden)

```json
{
    "success": false,
    "error": "license_revoked",
    "message": "This license has been revoked. Please contact support.",
    "reason": "Payment dispute"
}
```

#### Response - Already Activated (409 Conflict)

```json
{
    "success": false,
    "error": "already_activated",
    "message": "This license is already activated on another device. Contact support if you need to transfer it."
}
```

---

### Endpoint 2: License Validation

**POST** `/license/validate`

This endpoint is called:
- On every app startup
- Every 24 hours while the app is running
- When user manually clicks "Refresh" in the app

#### Request

```http
POST /api/v1/license/validate HTTP/1.1
Host: libro.yoursite.com
Content-Type: application/json

{
    "organization_id": "ORG-12345",
    "license_key": "ABCD-EFGH-IJKL-MNOP"
}
```

#### Response - Valid License (200 OK)

```json
{
    "success": true,
    "valid": true,
    "license": {
        "tier": "premium",
        "tier_name": "Premium",
        "expiry_date": "2027-01-25",
        "days_remaining": 365,
        "is_active": true,
        "features": {
            "circulation": true,
            "catalog": true,
            "reports_advanced": true,
            "opac": true,
            "email_notifications": true,
            "api_access": true
        }
    },
    "organization": {
        "name": "Springfield Public Library",
        "location": "Springfield, IL"
    },
    "server_time": "2026-01-25T10:30:00Z"
}
```

#### Response - Expired License (200 OK with valid=false)

```json
{
    "success": true,
    "valid": false,
    "reason": "expired",
    "license": {
        "tier": "premium",
        "expiry_date": "2026-01-20",
        "days_since_expiry": 5,
        "is_active": false
    },
    "message": "Your license expired 5 days ago. You have 2 days remaining in the grace period.",
    "grace_period": {
        "enabled": true,
        "days_remaining": 2,
        "ends_on": "2026-01-27"
    },
    "renewal_url": "https://libro.yoursite.com/renew?org=ORG-12345",
    "server_time": "2026-01-25T10:30:00Z"
}
```

#### Response - Blocked (Grace Period Ended)

```json
{
    "success": true,
    "valid": false,
    "reason": "blocked",
    "license": {
        "tier": "premium",
        "expiry_date": "2026-01-10",
        "days_since_expiry": 15,
        "is_active": false
    },
    "message": "Your license expired 15 days ago and the grace period has ended. Please renew to continue using the application.",
    "grace_period": {
        "enabled": false,
        "days_remaining": 0
    },
    "renewal_url": "https://libro.yoursite.com/renew?org=ORG-12345",
    "server_time": "2026-01-25T10:30:00Z"
}
```

#### Response - Invalid Credentials (401)

```json
{
    "success": false,
    "valid": false,
    "error": "invalid_credentials",
    "message": "License validation failed. Invalid credentials."
}
```

---

### Endpoint 3: Check Renewal Status (Optional)

**POST** `/license/check-renewal`

Called after user claims they've renewed to check if a new license key exists.

#### Request

```json
{
    "organization_id": "ORG-12345",
    "old_license_key": "ABCD-EFGH-IJKL-MNOP"
}
```

#### Response - New License Available

```json
{
    "success": true,
    "renewal_available": true,
    "message": "A new license key is available for your organization.",
    "new_license": {
        "license_key": "QRST-UVWX-YZ12-3456",
        "tier": "premium",
        "expiry_date": "2027-01-25"
    },
    "instructions": "Please enter the new license key in the activation screen."
}
```

#### Response - No Renewal Found

```json
{
    "success": true,
    "renewal_available": false,
    "message": "No renewal found. Please complete your renewal at the link below.",
    "renewal_url": "https://libro.yoursite.com/renew?org=ORG-12345"
}
```

---

## Business Logic

### License Key Generation

Generate secure, human-readable license keys:

```python
# Python example
import secrets
import string

def generate_license_key():
    """Generate a license key in format XXXX-XXXX-XXXX-XXXX"""
    chars = string.ascii_uppercase + string.digits
    # Remove confusing characters: 0, O, I, L, 1
    chars = chars.replace('0', '').replace('O', '').replace('I', '').replace('L', '').replace('1', '')
    
    segments = []
    for _ in range(4):
        segment = ''.join(secrets.choice(chars) for _ in range(4))
        segments.append(segment)
    
    return '-'.join(segments)

# Example output: "A7KM-B2NP-C9QR-D4ST"
```

```javascript
// Node.js example
const crypto = require('crypto');

function generateLicenseKey() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    let key = [];
    
    for (let i = 0; i < 4; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
            const randomIndex = crypto.randomInt(0, chars.length);
            segment += chars[randomIndex];
        }
        key.push(segment);
    }
    
    return key.join('-');
}
```

### Organization ID Generation

```python
def generate_organization_id():
    """Generate organization ID in format ORG-XXXXX"""
    import random
    number = random.randint(10000, 99999)
    return f"ORG-{number}"
```

### License Validation Logic

```python
from datetime import date, timedelta

GRACE_PERIOD_DAYS = 7

def validate_license(organization_id: str, license_key: str) -> dict:
    """
    Validate a license and return its status.
    
    Returns:
        dict with keys: valid, status, days_remaining, grace_days_remaining, etc.
    """
    
    # 1. Look up the license
    license = db.query("""
        SELECT l.*, o.*, t.tier_code, t.tier_name, t.features
        FROM licenses l
        JOIN organizations o ON l.organization_id = o.id
        JOIN subscription_tiers t ON l.tier_id = t.id
        WHERE o.organization_id = %s AND l.license_key = %s
    """, [organization_id, license_key])
    
    if not license:
        return {
            'valid': False,
            'error': 'invalid_credentials',
            'message': 'Invalid Organization ID or License Key'
        }
    
    # 2. Check if license is revoked
    if license['is_revoked']:
        return {
            'valid': False,
            'error': 'license_revoked',
            'message': 'This license has been revoked',
            'reason': license['revoked_reason']
        }
    
    # 3. Check if organization is active
    if not license['is_active']:
        return {
            'valid': False,
            'error': 'organization_inactive',
            'message': 'This organization account is inactive'
        }
    
    # 4. Calculate expiry status
    today = date.today()
    expiry_date = license['expiry_date']
    
    if today <= expiry_date:
        # License is active
        days_remaining = (expiry_date - today).days
        return {
            'valid': True,
            'status': 'active',
            'tier': license['tier_code'],
            'tier_name': license['tier_name'],
            'expiry_date': expiry_date.isoformat(),
            'days_remaining': days_remaining,
            'features': license['features'],
            'organization': {
                'name': license['name'],
                'location': license['location']
            }
        }
    
    # 5. License is expired - check grace period
    days_since_expiry = (today - expiry_date).days
    grace_days_remaining = GRACE_PERIOD_DAYS - days_since_expiry
    
    if grace_days_remaining > 0:
        # In grace period
        return {
            'valid': False,
            'status': 'grace_period',
            'tier': license['tier_code'],
            'expiry_date': expiry_date.isoformat(),
            'days_since_expiry': days_since_expiry,
            'grace_period': {
                'enabled': True,
                'days_remaining': grace_days_remaining,
                'ends_on': (expiry_date + timedelta(days=GRACE_PERIOD_DAYS)).isoformat()
            },
            'message': f'License expired {days_since_expiry} days ago. {grace_days_remaining} grace days remaining.'
        }
    
    # 6. Grace period ended - blocked
    return {
        'valid': False,
        'status': 'blocked',
        'tier': license['tier_code'],
        'expiry_date': expiry_date.isoformat(),
        'days_since_expiry': days_since_expiry,
        'grace_period': {
            'enabled': False,
            'days_remaining': 0
        },
        'message': 'License expired and grace period ended. Please renew.'
    }
```

### Trial License Logic

```python
TRIAL_DURATION_DAYS = 7

def create_trial_license(organization_id: int) -> dict:
    """Create a trial license for a new organization."""
    
    license_key = generate_license_key()
    activation_date = date.today()
    expiry_date = activation_date + timedelta(days=TRIAL_DURATION_DAYS)
    
    # Get trial tier ID
    trial_tier = db.query("SELECT id FROM subscription_tiers WHERE tier_code = 'trial'")
    
    license_id = db.insert("""
        INSERT INTO licenses (organization_id, license_key, tier_id, activation_date, expiry_date, is_active)
        VALUES (%s, %s, %s, %s, %s, TRUE)
    """, [organization_id, license_key, trial_tier['id'], activation_date, expiry_date])
    
    return {
        'license_key': license_key,
        'tier': 'trial',
        'activation_date': activation_date.isoformat(),
        'expiry_date': expiry_date.isoformat(),
        'days_remaining': TRIAL_DURATION_DAYS
    }
```

### Renewal Logic

When a customer renews, you create a NEW license key (as discussed):

```python
def process_renewal(organization_id: str, new_tier: str, duration_months: int) -> dict:
    """
    Process a subscription renewal.
    Creates a new license key and deactivates the old one.
    """
    
    # 1. Get organization
    org = db.query("SELECT * FROM organizations WHERE organization_id = %s", [organization_id])
    if not org:
        raise ValueError("Organization not found")
    
    # 2. Deactivate old license(s)
    db.execute("""
        UPDATE licenses SET is_active = FALSE 
        WHERE organization_id = %s AND is_active = TRUE
    """, [org['id']])
    
    # 3. Generate new license
    new_license_key = generate_license_key()
    tier = db.query("SELECT * FROM subscription_tiers WHERE tier_code = %s", [new_tier])
    
    # Calculate new expiry (from today, not from old expiry)
    activation_date = date.today()
    expiry_date = activation_date + timedelta(days=duration_months * 30)
    
    # 4. Create new license
    db.insert("""
        INSERT INTO licenses (organization_id, license_key, tier_id, activation_date, expiry_date, is_active)
        VALUES (%s, %s, %s, %s, %s, TRUE)
    """, [org['id'], new_license_key, tier['id'], activation_date, expiry_date])
    
    # 5. Send new license key to customer (email)
    send_renewal_email(org['email'], {
        'organization_name': org['name'],
        'new_license_key': new_license_key,
        'tier': new_tier,
        'expiry_date': expiry_date.isoformat()
    })
    
    return {
        'success': True,
        'new_license_key': new_license_key,
        'tier': new_tier,
        'expiry_date': expiry_date.isoformat()
    }
```

---

## Security Requirements

### 1. HTTPS Only

All API endpoints MUST use HTTPS. Configure your web server:

```nginx
# Nginx configuration
server {
    listen 80;
    server_name libro.yoursite.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name libro.yoursite.com;
    
    ssl_certificate /etc/letsencrypt/live/libro.yoursite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/libro.yoursite.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # ... rest of config
}
```

### 2. Rate Limiting

Prevent brute-force attacks on license validation:

```python
# Python/Flask with Flask-Limiter
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/api/v1/license/activate', methods=['POST'])
@limiter.limit("5 per minute")  # Max 5 activation attempts per minute
def activate_license():
    # ...

@app.route('/api/v1/license/validate', methods=['POST'])
@limiter.limit("60 per minute")  # Max 60 validations per minute
def validate_license():
    # ...
```

```javascript
// Node.js/Express with express-rate-limit
const rateLimit = require('express-rate-limit');

const activationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 requests per minute
    message: { error: 'Too many activation attempts. Try again later.' }
});

const validationLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: 'Too many requests. Try again later.' }
});

app.post('/api/v1/license/activate', activationLimiter, activateHandler);
app.post('/api/v1/license/validate', validationLimiter, validateHandler);
```

### 3. Input Validation

Always validate and sanitize inputs:

```python
import re

def validate_organization_id(org_id: str) -> bool:
    """Validate organization ID format: ORG-XXXXX"""
    return bool(re.match(r'^ORG-\d{5}$', org_id))

def validate_license_key(key: str) -> bool:
    """Validate license key format: XXXX-XXXX-XXXX-XXXX"""
    return bool(re.match(r'^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$', key))
```

### 4. Logging

Log all activation and validation attempts:

```python
def log_validation(license_id: int, ip_address: str, result: str, response: dict):
    db.insert("""
        INSERT INTO license_validations (license_id, ip_address, validation_result, response_sent)
        VALUES (%s, %s, %s, %s)
    """, [license_id, ip_address, result, json.dumps(response)])
```

### 5. Admin Authentication

Use secure password hashing for admin portal:

```python
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hash.encode('utf-8'))
```

---

## Implementation Examples

### Node.js/Express Complete Example

```javascript
// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// Rate limiters
const activationLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    message: { success: false, error: 'rate_limit', message: 'Too many attempts. Try again in a minute.' }
});

const validationLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60
});

// Constants
const GRACE_PERIOD_DAYS = 7;

// Helper functions
function generateLicenseKey() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let key = [];
    for (let i = 0; i < 4; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
            segment += chars[Math.floor(Math.random() * chars.length)];
        }
        key.push(segment);
    }
    return key.join('-');
}

function validateInputs(orgId, licenseKey) {
    const orgIdPattern = /^ORG-\d{5}$/;
    const keyPattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    
    return orgIdPattern.test(orgId) && keyPattern.test(licenseKey);
}

function calculateDaysDifference(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date2 - date1) / oneDay);
}

// ==================== API ENDPOINTS ====================

// POST /api/v1/license/activate
app.post('/api/v1/license/activate', activationLimiter, async (req, res) => {
    try {
        const { organization_id, license_key } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        // Validate input format
        if (!organization_id || !license_key) {
            return res.status(400).json({
                success: false,
                error: 'missing_fields',
                message: 'Organization ID and License Key are required.'
            });
        }
        
        if (!validateInputs(organization_id, license_key)) {
            return res.status(400).json({
                success: false,
                error: 'invalid_format',
                message: 'Invalid Organization ID or License Key format.'
            });
        }
        
        // Look up license
        const [rows] = await pool.execute(`
            SELECT l.*, o.name, o.location, o.address, o.phone, o.email,
                   t.tier_code, t.tier_name, t.features
            FROM licenses l
            JOIN organizations o ON l.organization_id = o.id
            JOIN subscription_tiers t ON l.tier_id = t.id
            WHERE o.organization_id = ? AND l.license_key = ? AND l.is_active = TRUE
        `, [organization_id, license_key]);
        
        if (rows.length === 0) {
            // Log failed attempt
            await pool.execute(`
                INSERT INTO license_activations (license_id, ip_address, success, failure_reason)
                VALUES (NULL, ?, FALSE, 'Invalid credentials')
            `, [ipAddress]);
            
            return res.status(401).json({
                success: false,
                error: 'invalid_credentials',
                message: 'The Organization ID or License Key is incorrect.'
            });
        }
        
        const license = rows[0];
        
        // Check if revoked
        if (license.is_revoked) {
            return res.status(403).json({
                success: false,
                error: 'license_revoked',
                message: 'This license has been revoked.',
                reason: license.revoked_reason
            });
        }
        
        // Check expiry
        const today = new Date();
        const expiryDate = new Date(license.expiry_date);
        
        if (today > expiryDate) {
            const daysSinceExpiry = calculateDaysDifference(expiryDate, today);
            
            return res.status(403).json({
                success: false,
                error: 'license_expired',
                message: `This license expired ${daysSinceExpiry} days ago.`,
                expiry_date: license.expiry_date
            });
        }
        
        // Update activation date if first activation
        if (!license.activation_date) {
            await pool.execute(`
                UPDATE licenses SET activation_date = CURDATE() WHERE id = ?
            `, [license.id]);
        }
        
        // Log successful activation
        await pool.execute(`
            INSERT INTO license_activations (license_id, ip_address, success, request_data)
            VALUES (?, ?, TRUE, ?)
        `, [license.id, ipAddress, JSON.stringify(req.body)]);
        
        // Return success response
        const daysRemaining = calculateDaysDifference(today, expiryDate);
        
        res.json({
            success: true,
            message: 'License activated successfully',
            license: {
                tier: license.tier_code,
                tier_name: license.tier_name,
                activation_date: license.activation_date || today.toISOString().split('T')[0],
                expiry_date: license.expiry_date,
                days_remaining: daysRemaining,
                features: JSON.parse(license.features || '{}')
            },
            organization: {
                name: license.name,
                location: license.location,
                address: license.address,
                phone: license.phone,
                email: license.email
            }
        });
        
    } catch (error) {
        console.error('Activation error:', error);
        res.status(500).json({
            success: false,
            error: 'server_error',
            message: 'An unexpected error occurred. Please try again later.'
        });
    }
});

// POST /api/v1/license/validate
app.post('/api/v1/license/validate', validationLimiter, async (req, res) => {
    try {
        const { organization_id, license_key } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        
        // Validate input
        if (!organization_id || !license_key || !validateInputs(organization_id, license_key)) {
            return res.status(401).json({
                success: false,
                valid: false,
                error: 'invalid_credentials',
                message: 'Invalid credentials provided.'
            });
        }
        
        // Look up license
        const [rows] = await pool.execute(`
            SELECT l.*, o.name, o.location, o.organization_id as org_id,
                   t.tier_code, t.tier_name, t.features
            FROM licenses l
            JOIN organizations o ON l.organization_id = o.id
            JOIN subscription_tiers t ON l.tier_id = t.id
            WHERE o.organization_id = ? AND l.license_key = ?
        `, [organization_id, license_key]);
        
        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                valid: false,
                error: 'invalid_credentials',
                message: 'License validation failed. Invalid credentials.'
            });
        }
        
        const license = rows[0];
        const today = new Date();
        const expiryDate = new Date(license.expiry_date);
        let response;
        
        // Check various states
        if (license.is_revoked) {
            response = {
                success: true,
                valid: false,
                reason: 'revoked',
                message: 'This license has been revoked.',
                server_time: today.toISOString()
            };
        } else if (!license.is_active) {
            response = {
                success: true,
                valid: false,
                reason: 'inactive',
                message: 'This license is no longer active.',
                server_time: today.toISOString()
            };
        } else if (today <= expiryDate) {
            // License is valid
            const daysRemaining = calculateDaysDifference(today, expiryDate);
            
            response = {
                success: true,
                valid: true,
                license: {
                    tier: license.tier_code,
                    tier_name: license.tier_name,
                    expiry_date: license.expiry_date,
                    days_remaining: daysRemaining,
                    is_active: true,
                    features: JSON.parse(license.features || '{}')
                },
                organization: {
                    name: license.name,
                    location: license.location
                },
                server_time: today.toISOString()
            };
        } else {
            // License expired - check grace period
            const daysSinceExpiry = calculateDaysDifference(expiryDate, today);
            const graceDaysRemaining = GRACE_PERIOD_DAYS - daysSinceExpiry;
            
            if (graceDaysRemaining > 0) {
                // In grace period
                const graceEndDate = new Date(expiryDate);
                graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);
                
                response = {
                    success: true,
                    valid: false,
                    reason: 'expired',
                    license: {
                        tier: license.tier_code,
                        expiry_date: license.expiry_date,
                        days_since_expiry: daysSinceExpiry,
                        is_active: false
                    },
                    message: `Your license expired ${daysSinceExpiry} days ago. ${graceDaysRemaining} grace days remaining.`,
                    grace_period: {
                        enabled: true,
                        days_remaining: graceDaysRemaining,
                        ends_on: graceEndDate.toISOString().split('T')[0]
                    },
                    renewal_url: `https://libro.yoursite.com/renew?org=${organization_id}`,
                    server_time: today.toISOString()
                };
            } else {
                // Blocked
                response = {
                    success: true,
                    valid: false,
                    reason: 'blocked',
                    license: {
                        tier: license.tier_code,
                        expiry_date: license.expiry_date,
                        days_since_expiry: daysSinceExpiry,
                        is_active: false
                    },
                    message: 'Your license has expired and the grace period has ended. Please renew.',
                    grace_period: {
                        enabled: false,
                        days_remaining: 0
                    },
                    renewal_url: `https://libro.yoursite.com/renew?org=${organization_id}`,
                    server_time: today.toISOString()
                };
            }
        }
        
        // Log validation
        const validationResult = response.valid ? 'valid' : (response.reason || 'invalid');
        await pool.execute(`
            INSERT INTO license_validations (license_id, ip_address, validation_result, response_sent)
            VALUES (?, ?, ?, ?)
        `, [license.id, ipAddress, validationResult, JSON.stringify(response)]);
        
        res.json(response);
        
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            success: false,
            valid: false,
            error: 'server_error',
            message: 'Validation service temporarily unavailable.'
        });
    }
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Libro License Server running on port ${PORT}`);
});
```

### Python/FastAPI Complete Example

```python
# main.py
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import mysql.connector
from mysql.connector import pooling
from datetime import date, datetime, timedelta
import os
import json
import re
import secrets
import string

# Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'libro'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'libro_license')
}

GRACE_PERIOD_DAYS = 7

# Initialize FastAPI app
app = FastAPI(title="Libro License Server", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Database connection pool
db_pool = pooling.MySQLConnectionPool(
    pool_name="libro_pool",
    pool_size=10,
    **DB_CONFIG
)

def get_db():
    conn = db_pool.get_connection()
    try:
        yield conn
    finally:
        conn.close()

# Pydantic models
class LicenseRequest(BaseModel):
    organization_id: str
    license_key: str
    
    @validator('organization_id')
    def validate_org_id(cls, v):
        if not re.match(r'^ORG-\d{5}$', v):
            raise ValueError('Invalid Organization ID format')
        return v
    
    @validator('license_key')
    def validate_license_key(cls, v):
        if not re.match(r'^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$', v):
            raise ValueError('Invalid License Key format')
        return v

class ActivationResponse(BaseModel):
    success: bool
    message: str = None
    error: str = None
    license: dict = None
    organization: dict = None

class ValidationResponse(BaseModel):
    success: bool
    valid: bool = None
    reason: str = None
    license: dict = None
    organization: dict = None
    message: str = None
    grace_period: dict = None
    renewal_url: str = None
    server_time: str = None
    error: str = None

# Helper functions
def generate_license_key() -> str:
    chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    segments = [''.join(secrets.choice(chars) for _ in range(4)) for _ in range(4)]
    return '-'.join(segments)

def days_between(d1: date, d2: date) -> int:
    return (d2 - d1).days

# API Endpoints
@app.post("/api/v1/license/activate", response_model=ActivationResponse)
@limiter.limit("5/minute")
async def activate_license(request: Request, data: LicenseRequest, db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    ip_address = request.client.host
    
    try:
        # Look up license
        cursor.execute("""
            SELECT l.*, o.name, o.location, o.address, o.phone, o.email,
                   t.tier_code, t.tier_name, t.features
            FROM licenses l
            JOIN organizations o ON l.organization_id = o.id
            JOIN subscription_tiers t ON l.tier_id = t.id
            WHERE o.organization_id = %s AND l.license_key = %s AND l.is_active = TRUE
        """, (data.organization_id, data.license_key))
        
        license_row = cursor.fetchone()
        
        if not license_row:
            # Log failed attempt
            cursor.execute("""
                INSERT INTO license_activations (license_id, ip_address, success, failure_reason)
                VALUES (NULL, %s, FALSE, 'Invalid credentials')
            """, (ip_address,))
            db.commit()
            
            raise HTTPException(status_code=401, detail={
                "success": False,
                "error": "invalid_credentials",
                "message": "The Organization ID or License Key is incorrect."
            })
        
        # Check if revoked
        if license_row['is_revoked']:
            raise HTTPException(status_code=403, detail={
                "success": False,
                "error": "license_revoked",
                "message": "This license has been revoked.",
                "reason": license_row['revoked_reason']
            })
        
        # Check expiry
        today = date.today()
        expiry_date = license_row['expiry_date']
        
        if today > expiry_date:
            days_expired = days_between(expiry_date, today)
            raise HTTPException(status_code=403, detail={
                "success": False,
                "error": "license_expired",
                "message": f"This license expired {days_expired} days ago.",
                "expiry_date": expiry_date.isoformat()
            })
        
        # Update activation date if needed
        if not license_row['activation_date']:
            cursor.execute("UPDATE licenses SET activation_date = CURDATE() WHERE id = %s", 
                          (license_row['id'],))
        
        # Log success
        cursor.execute("""
            INSERT INTO license_activations (license_id, ip_address, success, request_data)
            VALUES (%s, %s, TRUE, %s)
        """, (license_row['id'], ip_address, json.dumps(data.dict())))
        db.commit()
        
        # Parse features
        features = json.loads(license_row['features']) if license_row['features'] else {}
        days_remaining = days_between(today, expiry_date)
        
        return {
            "success": True,
            "message": "License activated successfully",
            "license": {
                "tier": license_row['tier_code'],
                "tier_name": license_row['tier_name'],
                "activation_date": (license_row['activation_date'] or today).isoformat(),
                "expiry_date": expiry_date.isoformat(),
                "days_remaining": days_remaining,
                "features": features
            },
            "organization": {
                "name": license_row['name'],
                "location": license_row['location'],
                "address": license_row['address'],
                "phone": license_row['phone'],
                "email": license_row['email']
            }
        }
        
    finally:
        cursor.close()


@app.post("/api/v1/license/validate", response_model=ValidationResponse)
@limiter.limit("60/minute")
async def validate_license(request: Request, data: LicenseRequest, db=Depends(get_db)):
    cursor = db.cursor(dictionary=True)
    ip_address = request.client.host
    
    try:
        cursor.execute("""
            SELECT l.*, o.name, o.location, o.organization_id as org_id,
                   t.tier_code, t.tier_name, t.features
            FROM licenses l
            JOIN organizations o ON l.organization_id = o.id
            JOIN subscription_tiers t ON l.tier_id = t.id
            WHERE o.organization_id = %s AND l.license_key = %s
        """, (data.organization_id, data.license_key))
        
        license_row = cursor.fetchone()
        
        if not license_row:
            raise HTTPException(status_code=401, detail={
                "success": False,
                "valid": False,
                "error": "invalid_credentials",
                "message": "License validation failed. Invalid credentials."
            })
        
        today = date.today()
        now = datetime.utcnow()
        expiry_date = license_row['expiry_date']
        features = json.loads(license_row['features']) if license_row['features'] else {}
        
        # Determine license state
        if license_row['is_revoked']:
            response = {
                "success": True,
                "valid": False,
                "reason": "revoked",
                "message": "This license has been revoked.",
                "server_time": now.isoformat() + "Z"
            }
            validation_result = "revoked"
            
        elif not license_row['is_active']:
            response = {
                "success": True,
                "valid": False,
                "reason": "inactive",
                "message": "This license is no longer active.",
                "server_time": now.isoformat() + "Z"
            }
            validation_result = "invalid"
            
        elif today <= expiry_date:
            # Valid license
            days_remaining = days_between(today, expiry_date)
            response = {
                "success": True,
                "valid": True,
                "license": {
                    "tier": license_row['tier_code'],
                    "tier_name": license_row['tier_name'],
                    "expiry_date": expiry_date.isoformat(),
                    "days_remaining": days_remaining,
                    "is_active": True,
                    "features": features
                },
                "organization": {
                    "name": license_row['name'],
                    "location": license_row['location']
                },
                "server_time": now.isoformat() + "Z"
            }
            validation_result = "valid"
            
        else:
            # Expired - check grace period
            days_since_expiry = days_between(expiry_date, today)
            grace_days_remaining = GRACE_PERIOD_DAYS - days_since_expiry
            grace_end = expiry_date + timedelta(days=GRACE_PERIOD_DAYS)
            
            if grace_days_remaining > 0:
                response = {
                    "success": True,
                    "valid": False,
                    "reason": "expired",
                    "license": {
                        "tier": license_row['tier_code'],
                        "expiry_date": expiry_date.isoformat(),
                        "days_since_expiry": days_since_expiry,
                        "is_active": False
                    },
                    "message": f"License expired {days_since_expiry} days ago. {grace_days_remaining} grace days remaining.",
                    "grace_period": {
                        "enabled": True,
                        "days_remaining": grace_days_remaining,
                        "ends_on": grace_end.isoformat()
                    },
                    "renewal_url": f"https://libro.yoursite.com/renew?org={data.organization_id}",
                    "server_time": now.isoformat() + "Z"
                }
                validation_result = "expired"
            else:
                response = {
                    "success": True,
                    "valid": False,
                    "reason": "blocked",
                    "license": {
                        "tier": license_row['tier_code'],
                        "expiry_date": expiry_date.isoformat(),
                        "days_since_expiry": days_since_expiry,
                        "is_active": False
                    },
                    "message": "License expired and grace period ended. Please renew.",
                    "grace_period": {
                        "enabled": False,
                        "days_remaining": 0
                    },
                    "renewal_url": f"https://libro.yoursite.com/renew?org={data.organization_id}",
                    "server_time": now.isoformat() + "Z"
                }
                validation_result = "expired"
        
        # Log validation
        cursor.execute("""
            INSERT INTO license_validations (license_id, ip_address, validation_result, response_sent)
            VALUES (%s, %s, %s, %s)
        """, (license_row['id'], ip_address, validation_result, json.dumps(response)))
        db.commit()
        
        return response
        
    finally:
        cursor.close()


@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat() + "Z"}


# Run with: uvicorn main:app --host 0.0.0.0 --port 3000
```

---

## Admin Portal Features

The admin web portal should include these features:

### 1. Dashboard
- Total active organizations
- Revenue metrics
- Licenses expiring soon (next 30 days)
- Recent activations and validations

### 2. Organization Management
- List all organizations with search/filter
- Create new organization
- Edit organization details
- View organization's license history
- Generate new license key for organization

### 3. License Management
- View all licenses
- Filter by status (active, expired, trial)
- Revoke license
- Extend license expiry
- Create renewal (generates new key)

### 4. Reports
- Activation logs
- Validation logs
- Revenue reports
- Expiry reports

### Admin Portal API Endpoints (for portal frontend)

```
POST   /admin/login                    - Admin authentication
GET    /admin/dashboard                - Dashboard statistics
GET    /admin/organizations            - List organizations
POST   /admin/organizations            - Create organization
GET    /admin/organizations/:id        - Get organization details
PUT    /admin/organizations/:id        - Update organization
DELETE /admin/organizations/:id        - Deactivate organization
POST   /admin/organizations/:id/license - Generate new license
GET    /admin/licenses                 - List all licenses
PUT    /admin/licenses/:id             - Update license (extend, revoke)
GET    /admin/logs/activations         - Activation logs
GET    /admin/logs/validations         - Validation logs
```

---

## Testing Guide

### Test Scenarios

```bash
# 1. Test valid activation
curl -X POST https://libro.yoursite.com/api/v1/license/activate \
  -H "Content-Type: application/json" \
  -d '{"organization_id": "ORG-12345", "license_key": "ABCD-EFGH-IJKL-MNOP"}'

# 2. Test invalid credentials
curl -X POST https://libro.yoursite.com/api/v1/license/activate \
  -H "Content-Type: application/json" \
  -d '{"organization_id": "ORG-99999", "license_key": "XXXX-XXXX-XXXX-XXXX"}'

# 3. Test validation
curl -X POST https://libro.yoursite.com/api/v1/license/validate \
  -H "Content-Type: application/json" \
  -d '{"organization_id": "ORG-12345", "license_key": "ABCD-EFGH-IJKL-MNOP"}'

# 4. Test rate limiting (run multiple times quickly)
for i in {1..10}; do
  curl -X POST https://libro.yoursite.com/api/v1/license/activate \
    -H "Content-Type: application/json" \
    -d '{"organization_id": "ORG-12345", "license_key": "WRONG-KEY-HERE-TEST"}'
done

# 5. Health check
curl https://libro.yoursite.com/api/v1/health
```

### Test Data Setup

```sql
-- Insert test organization
INSERT INTO organizations (organization_id, name, location, address, phone, email)
VALUES ('ORG-12345', 'Test Library', 'Test City', '123 Test St', '555-0100', 'test@library.com');

-- Insert test license (valid for 30 days)
INSERT INTO licenses (organization_id, license_key, tier_id, activation_date, expiry_date, is_active)
VALUES (1, 'TEST-ABCD-EFGH-1234', 3, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), TRUE);

-- Insert expired license for grace period testing
INSERT INTO licenses (organization_id, license_key, tier_id, activation_date, expiry_date, is_active)
VALUES (1, 'TEST-EXPR-GRAC-5678', 3, DATE_SUB(CURDATE(), INTERVAL 35 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY), TRUE);

-- Insert blocked license (expired > 7 days)
INSERT INTO licenses (organization_id, license_key, tier_id, activation_date, expiry_date, is_active)
VALUES (1, 'TEST-BLKD-EXPR-9012', 3, DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_SUB(CURDATE(), INTERVAL 15 DAY), TRUE);
```

---

## Environment Variables

Create a `.env` file:

```env
# Database
DB_HOST=localhost
DB_USER=libro_admin
DB_PASSWORD=your_secure_password
DB_NAME=libro_license

# Server
PORT=3000
NODE_ENV=production

# Optional: Redis for rate limiting
REDIS_URL=redis://localhost:6379

# Admin portal
JWT_SECRET=your_jwt_secret_key
ADMIN_SESSION_DURATION=86400
```

---

## Deployment Checklist

- [ ] Set up MySQL/PostgreSQL database
- [ ] Run database schema migrations
- [ ] Configure environment variables
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure Nginx/Apache reverse proxy
- [ ] Enable rate limiting
- [ ] Set up logging and monitoring
- [ ] Create initial admin user
- [ ] Test all endpoints
- [ ] Set up automated backups
- [ ] Configure firewall rules

---

## Summary

This server needs to:

1. **Store** organizations and their licenses in a database
2. **Validate** license keys when the desktop app requests
3. **Track** activation and validation attempts for security
4. **Calculate** license status including grace periods
5. **Provide** an admin portal for managing customers

The desktop AppManager will call:
- `POST /api/v1/license/activate` - First-time activation
- `POST /api/v1/license/validate` - Periodic validation

Both endpoints return JSON with license status that the desktop app interprets to show the appropriate UI (active, grace period warning, or blocked).
