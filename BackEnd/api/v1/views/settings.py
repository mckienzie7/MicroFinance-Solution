#!/usr/bin/env python3
"""Settings API endpoints for admin configuration"""

from flask import Blueprint, jsonify, request
from BackEnd.models import storage
from BackEnd.models.user import User
from BackEnd.api.v1.views import app_views
from BackEnd.Controllers.AuthController import AuthController
from functools import wraps
import json
import os
import tempfile

# Default settings structure
DEFAULT_SETTINGS = {
    'security': {
        'minPasswordLength': 8,
        'requireSpecialChar': True,
        'requireUppercase': True,
        'requireNumbers': True,
        'twoFactorEnabled': False,
        'sessionTimeout': 30,
        'maxLoginAttempts': 5,
        'passwordExpiryDays': 90
    },
    'financial': {
        'defaultInterestRate': 12.5,
        'loanProcessingFee': 2.5,
        'latePenaltyRate': 5.0,
        'minLoanAmount': 1000,
        'maxLoanAmount': 100000,
        'defaultLoanTerm': 12,
        'earlyRepaymentPenalty': 0
    },
    'user': {
        'defaultRole': 'user',
        'maxUsers': 1000,
        'autoApproveUsers': False,
        'requireEmailVerification': True,
        'allowSelfRegistration': True,
        'defaultCreditScore': 500
    },
    'analytics': {
        'dataRetentionMonths': 24,
        'reportFrequency': 'weekly',
        'enableTracking': True,
        'anonymizeData': False,
        'exportFormat': 'pdf'
    },
    'notifications': {
        'emailNotifications': True,
        'smsNotifications': False,
        'pushNotifications': True,
        'loanApprovalNotif': True,
        'paymentReminderNotif': True,
        'overdueNotif': True,
        'reminderDaysBefore': 3
    },
    'system': {
        'maintenanceMode': False,
        'allowNewLoans': True,
        'allowNewRegistrations': True,
        'systemLanguage': 'en',
        'timezone': 'UTC',
        'currency': 'USD',
        'dateFormat': 'MM/DD/YYYY'
    }
}


def admin_required(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get session ID from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Unauthorized'}), 401
        
        token = auth_header.split(' ')[1]
        auth_controller = AuthController()
        user = auth_controller.get_user_from_session_id(token)
        
        if not user:
            return jsonify({'error': 'Invalid session'}), 401
        
        # Check if user is admin
        if not user.admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function


@app_views.route('/admin/settings', methods=['GET'], strict_slashes=False)
@admin_required
def get_settings():
    """Get system settings"""
    try:
        # Try to load settings from file or database
        settings = load_settings()
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app_views.route('/admin/settings', methods=['PUT'], strict_slashes=False)
@admin_required
def update_settings():
    """Update system settings"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate settings structure
        validated_settings = validate_settings(data)
        
        # Save settings
        save_settings(validated_settings)
        
        return jsonify({
            'message': 'Settings updated successfully',
            'settings': validated_settings
        }), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_settings_file_path():
    """Get the settings file path (cross-platform)"""
    # Use system temp directory
    temp_dir = tempfile.gettempdir()
    return os.path.join(temp_dir, 'mfs_settings.json')


def load_settings():
    """Load settings from storage"""
    try:
        settings_file = get_settings_file_path()
        # Try to load from file
        with open(settings_file, 'r') as f:
            settings = json.load(f)
            return settings
    except FileNotFoundError:
        # Return default settings if file doesn't exist
        return DEFAULT_SETTINGS
    except Exception:
        return DEFAULT_SETTINGS


def save_settings(settings):
    """Save settings to storage"""
    try:
        settings_file = get_settings_file_path()
        # Ensure directory exists
        os.makedirs(os.path.dirname(settings_file), exist_ok=True)
        # Save to file (in production, use database)
        with open(settings_file, 'w') as f:
            json.dump(settings, f, indent=2)
        return True
    except Exception as e:
        raise Exception(f'Failed to save settings: {str(e)}')


def validate_settings(settings):
    """Validate settings data"""
    validated = {}
    
    # Validate security settings
    if 'security' in settings:
        sec = settings['security']
        validated['security'] = {
            'minPasswordLength': max(6, min(20, int(sec.get('minPasswordLength', 8)))),
            'requireSpecialChar': bool(sec.get('requireSpecialChar', True)),
            'requireUppercase': bool(sec.get('requireUppercase', True)),
            'requireNumbers': bool(sec.get('requireNumbers', True)),
            'twoFactorEnabled': bool(sec.get('twoFactorEnabled', False)),
            'sessionTimeout': max(5, min(1440, int(sec.get('sessionTimeout', 30)))),
            'maxLoginAttempts': max(3, min(10, int(sec.get('maxLoginAttempts', 5)))),
            'passwordExpiryDays': max(30, min(365, int(sec.get('passwordExpiryDays', 90))))
        }
    
    # Validate financial settings
    if 'financial' in settings:
        fin = settings['financial']
        validated['financial'] = {
            'defaultInterestRate': max(0, min(100, float(fin.get('defaultInterestRate', 12.5)))),
            'loanProcessingFee': max(0, min(20, float(fin.get('loanProcessingFee', 2.5)))),
            'latePenaltyRate': max(0, min(50, float(fin.get('latePenaltyRate', 5.0)))),
            'minLoanAmount': max(100, int(fin.get('minLoanAmount', 1000))),
            'maxLoanAmount': max(1000, int(fin.get('maxLoanAmount', 100000))),
            'defaultLoanTerm': max(1, min(60, int(fin.get('defaultLoanTerm', 12)))),
            'earlyRepaymentPenalty': max(0, min(10, float(fin.get('earlyRepaymentPenalty', 0))))
        }
    
    # Validate user settings
    if 'user' in settings:
        usr = settings['user']
        validated['user'] = {
            'defaultRole': usr.get('defaultRole', 'user'),
            'maxUsers': max(10, int(usr.get('maxUsers', 1000))),
            'autoApproveUsers': bool(usr.get('autoApproveUsers', False)),
            'requireEmailVerification': bool(usr.get('requireEmailVerification', True)),
            'allowSelfRegistration': bool(usr.get('allowSelfRegistration', True)),
            'defaultCreditScore': max(300, min(850, int(usr.get('defaultCreditScore', 500))))
        }
    
    # Validate analytics settings
    if 'analytics' in settings:
        ana = settings['analytics']
        validated['analytics'] = {
            'dataRetentionMonths': max(1, min(120, int(ana.get('dataRetentionMonths', 24)))),
            'reportFrequency': ana.get('reportFrequency', 'weekly'),
            'enableTracking': bool(ana.get('enableTracking', True)),
            'anonymizeData': bool(ana.get('anonymizeData', False)),
            'exportFormat': ana.get('exportFormat', 'pdf')
        }
    
    # Validate notification settings
    if 'notifications' in settings:
        notif = settings['notifications']
        validated['notifications'] = {
            'emailNotifications': bool(notif.get('emailNotifications', True)),
            'smsNotifications': bool(notif.get('smsNotifications', False)),
            'pushNotifications': bool(notif.get('pushNotifications', True)),
            'loanApprovalNotif': bool(notif.get('loanApprovalNotif', True)),
            'paymentReminderNotif': bool(notif.get('paymentReminderNotif', True)),
            'overdueNotif': bool(notif.get('overdueNotif', True)),
            'reminderDaysBefore': max(1, min(30, int(notif.get('reminderDaysBefore', 3))))
        }
    
    # Validate system settings
    if 'system' in settings:
        sys = settings['system']
        validated['system'] = {
            'maintenanceMode': bool(sys.get('maintenanceMode', False)),
            'allowNewLoans': bool(sys.get('allowNewLoans', True)),
            'allowNewRegistrations': bool(sys.get('allowNewRegistrations', True)),
            'systemLanguage': sys.get('systemLanguage', 'en'),
            'timezone': sys.get('timezone', 'UTC'),
            'currency': sys.get('currency', 'USD'),
            'dateFormat': sys.get('dateFormat', 'MM/DD/YYYY')
        }
    
    return validated
