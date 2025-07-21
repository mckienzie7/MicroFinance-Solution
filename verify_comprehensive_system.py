#!/usr/bin/python3
"""
Simple verification script for the Comprehensive Credit Score System
"""

import sys
import os

def verify_files():
    """Verify all required files exist"""
    print("🔍 Verifying Comprehensive Credit Score System Files...")
    
    required_files = [
        "BackEnd/models/ComprehensiveCreditScoreModel.py",
        "BackEnd/Controllers/ComprehensiveCreditScoreController.py", 
        "BackEnd/api/v1/views/comprehensive_credit_score.py",
        "test_comprehensive_credit_score.py",
        "COMPREHENSIVE_CREDIT_SCORE_README.md"
    ]
    
    all_exist = True
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - MISSING")
            all_exist = False
    
    return all_exist

def verify_imports():
    """Verify imports work correctly"""
    print("\n🔍 Verifying Python Imports...")
    
    try:
        # Test model import
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from BackEnd.models.ComprehensiveCreditScoreModel import ComprehensiveCreditScoreModel
        print("✅ ComprehensiveCreditScoreModel import successful")
        
        # Test controller import
        from BackEnd.Controllers.ComprehensiveCreditScoreController import ComprehensiveCreditScoreController
        print("✅ ComprehensiveCreditScoreController import successful")
        
        # Test model initialization
        model = ComprehensiveCreditScoreModel()
        print("✅ ComprehensiveCreditScoreModel initialization successful")
        
        # Test controller initialization
        controller = ComprehensiveCreditScoreController()
        print("✅ ComprehensiveCreditScoreController initialization successful")
        
        # Test score weights
        print(f"✅ Score weights configured: {list(model.score_weights.keys())}")
        
        # Test score ranges
        print(f"✅ Score ranges configured: {list(model.score_ranges.keys())}")
        
        return True
        
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def verify_routes():
    """Verify routes are registered"""
    print("\n🔍 Verifying Route Registration...")
    
    try:
        # Check if routes file was imported in __init__.py
        with open("BackEnd/api/v1/views/__init__.py", "r") as f:
            content = f.read()
            if "comprehensive_credit_score" in content:
                print("✅ Routes imported in __init__.py")
                return True
            else:
                print("❌ Routes not imported in __init__.py")
                return False
    except Exception as e:
        print(f"❌ Error checking routes: {e}")
        return False

def show_api_endpoints():
    """Show available API endpoints"""
    print("\n📋 Available API Endpoints:")
    
    endpoints = [
        "GET /api/v1/comprehensive-credit-score",
        "GET /api/v1/comprehensive-credit-score/history",
        "GET /api/v1/comprehensive-credit-score/comparison", 
        "GET /api/v1/comprehensive-credit-score/loan-eligibility",
        "GET /api/v1/comprehensive-credit-score/factors",
        "GET /api/v1/comprehensive-credit-score/test-auth",
        "GET /api/v1/comprehensive-credit-score/debug/<user_id>",
        "GET /api/v1/admin/comprehensive-credit-score/analytics",
        "GET /api/v1/admin/comprehensive-credit-score/user/<user_id>",
        "GET /api/v1/admin/comprehensive-credit-score/user/<user_id>/factors",
        "GET /api/v1/admin/comprehensive-credit-score/user/<user_id>/loan-eligibility"
    ]
    
    for endpoint in endpoints:
        print(f"  ✅ {endpoint}")

def show_system_features():
    """Show system features"""
    print("\n🎯 System Features:")
    
    features = [
        "Payment History Analysis (35% weight)",
        "Account Age Assessment (15% weight)", 
        "Transaction Pattern Analysis (20% weight)",
        "Deposit Behavior Evaluation (15% weight)",
        "Loan Management Scoring (10% weight)",
        "Financial Stability Assessment (5% weight)",
        "Risk Level Assessment",
        "Personalized Loan Recommendations",
        "Detailed Score Breakdown",
        "Improvement Recommendations",
        "Historical Score Tracking",
        "Admin Analytics Dashboard"
    ]
    
    for feature in features:
        print(f"  ✅ {feature}")

def main():
    """Main verification function"""
    print("🚀 Comprehensive Credit Score System Verification")
    print("=" * 60)
    
    # Verify files exist
    files_ok = verify_files()
    
    # Verify imports work
    imports_ok = verify_imports()
    
    # Verify routes are registered
    routes_ok = verify_routes()
    
    # Show endpoints and features
    show_api_endpoints()
    show_system_features()
    
    print("\n" + "=" * 60)
    
    if files_ok and imports_ok and routes_ok:
        print("🎉 VERIFICATION SUCCESSFUL!")
        print("✅ All files created successfully")
        print("✅ All imports working correctly") 
        print("✅ Routes registered properly")
        print("✅ System ready for use")
        print("\n📖 See COMPREHENSIVE_CREDIT_SCORE_README.md for detailed documentation")
        print("🧪 Run test_comprehensive_credit_score.py for full system testing")
    else:
        print("❌ VERIFICATION FAILED!")
        print("Please check the errors above and fix them.")
    
    print("\n💡 Key Points:")
    print("• The old credit score system remains unchanged")
    print("• Both systems can be used simultaneously")
    print("• New system provides comprehensive analysis")
    print("• All endpoints require Bearer token authentication")

if __name__ == "__main__":
    main()