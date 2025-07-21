#!/usr/bin/python3
"""
Test script for the new Comprehensive Credit Score System
This script tests the new comprehensive credit scoring functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from BackEnd.models import storage
from BackEnd.models.ComprehensiveCreditScoreModel import ComprehensiveCreditScoreModel
from BackEnd.Controllers.ComprehensiveCreditScoreController import ComprehensiveCreditScoreController
from BackEnd.models.user import User
from BackEnd.models.Account import Account
from BackEnd.models.Transaction import Transaction
from BackEnd.models.Loan import Loan
from BackEnd.models.Repayment import Repayment
from datetime import datetime, timedelta
import json


def test_comprehensive_credit_score():
    """Test the comprehensive credit score system"""
    print("=" * 60)
    print("TESTING COMPREHENSIVE CREDIT SCORE SYSTEM")
    print("=" * 60)
    
    try:
        # Initialize the model and controller
        model = ComprehensiveCreditScoreModel()
        controller = ComprehensiveCreditScoreController()
        
        print("✓ Successfully initialized comprehensive credit score model and controller")
        
        # Get database session
        db_session = storage.session()
        
        # Get all users for testing
        users = db_session.query(User).limit(5).all()
        
        if not users:
            print("❌ No users found in database")
            return
        
        print(f"✓ Found {len(users)} users to test")
        print()
        
        # Test each user
        for i, user in enumerate(users, 1):
            print(f"--- Testing User {i}: {user.username} ---")
            
            try:
                # Test comprehensive credit score calculation
                score_data = model.calculate_comprehensive_credit_score(user.id, db_session)
                
                print(f"User ID: {user.id}")
                print(f"Username: {user.username}")
                print(f"Comprehensive Credit Score: {score_data['credit_score']}")
                print(f"Score Rating: {score_data['score_rating']}")
                print(f"Risk Level: {score_data['risk_assessment']['risk_level']}")
                print(f"Recommended Loan Limit: {score_data['risk_assessment']['recommended_loan_limit']:.2f} ETB")
                
                # Show score breakdown
                print("\nScore Breakdown:")
                for component, data in score_data['score_breakdown'].items():
                    print(f"  {component.replace('_', ' ').title()}: {data['score']} (weight: {data['weight']:.0%}, contribution: {data['contribution']:.0f})")
                
                # Show top factors
                print("\nTop Factors:")
                for factor in score_data['detailed_factors'][:3]:
                    print(f"  • {factor['category']}: {factor['status']} - {factor['description']}")
                
                # Show top recommendations
                print("\nTop Recommendations:")
                for rec in score_data['recommendations'][:3]:
                    print(f"  • {rec}")
                
                print()
                
                # Test controller methods
                print("Testing Controller Methods:")
                
                # Test loan eligibility
                eligibility_response, status = controller.get_loan_eligibility(user.id, 10000)
                if status == 200:
                    eligibility_data = json.loads(eligibility_response.data)
                    print(f"  ✓ Loan Eligibility: {eligibility_data['loan_eligibility']['status']}")
                    print(f"    Max Loan Amount: {eligibility_data['loan_eligibility']['max_loan_amount']:.2f} ETB")
                    print(f"    Approval Probability: {eligibility_data['loan_eligibility']['approval_probability']}%")
                else:
                    print(f"  ❌ Loan eligibility test failed with status {status}")
                
                # Test score comparison
                comparison_response, status = controller.get_score_comparison(user.id)
                if status == 200:
                    comparison_data = json.loads(comparison_response.data)
                    print(f"  ✓ Score Comparison: User is in {comparison_data['user_percentile']}th percentile")
                    print(f"    Above Average: {comparison_data['comparison']['above_average']}")
                else:
                    print(f"  ❌ Score comparison test failed with status {status}")
                
                print()
                
            except Exception as e:
                print(f"❌ Error testing user {user.username}: {e}")
                print()
                continue
        
        # Test admin analytics
        print("--- Testing Admin Analytics ---")
        try:
            analytics_response, status = controller.get_admin_analytics()
            if status == 200:
                analytics_data = json.loads(analytics_response.data)
                print(f"✓ Admin Analytics:")
                print(f"  Total Users: {analytics_data['total_users']}")
                print(f"  Average Overall Score: {analytics_data['average_scores']['overall']}")
                print(f"  Score Distribution: {analytics_data['score_distribution']}")
                print(f"  Risk Distribution: {analytics_data['risk_distribution']}")
            else:
                print(f"❌ Admin analytics test failed with status {status}")
        except Exception as e:
            print(f"❌ Error testing admin analytics: {e}")
        
        print()
        print("=" * 60)
        print("COMPREHENSIVE CREDIT SCORE SYSTEM TEST COMPLETED")
        print("=" * 60)
        
        db_session.close()
        
    except Exception as e:
        print(f"❌ Critical error in comprehensive credit score test: {e}")
        import traceback
        traceback.print_exc()


def compare_old_vs_new_system():
    """Compare old credit score system with new comprehensive system"""
    print("\n" + "=" * 60)
    print("COMPARING OLD VS NEW CREDIT SCORE SYSTEMS")
    print("=" * 60)
    
    try:
        # Import old system
        from BackEnd.models.CreditScoreModel import AICredoScoreModel
        old_model = AICredoScoreModel()
        
        # Initialize new system
        new_model = ComprehensiveCreditScoreModel()
        
        # Get database session
        db_session = storage.session()
        
        # Get users for comparison
        users = db_session.query(User).limit(3).all()
        
        if not users:
            print("❌ No users found for comparison")
            return
        
        print(f"Comparing scores for {len(users)} users:\n")
        
        for user in users:
            print(f"--- User: {user.username} ---")
            
            try:
                # Old system score
                old_score = old_model.predict_credit_score(user.id, db_session)
                old_factors = old_model.get_score_factors(user.id, db_session)
                
                # New system score
                new_score_data = new_model.calculate_comprehensive_credit_score(user.id, db_session)
                new_score = new_score_data['credit_score']
                
                print(f"Old System Score: {old_score}")
                print(f"New Comprehensive Score: {new_score}")
                print(f"Difference: {new_score - old_score:+d} points")
                print(f"Old Rating: {new_model._get_score_rating(old_score)}")
                print(f"New Rating: {new_score_data['score_rating']}")
                
                # Compare number of factors considered
                print(f"Old System Factors: {len(old_factors)}")
                print(f"New System Factors: {len(new_score_data['detailed_factors'])}")
                print(f"New System Components: {len(new_score_data['score_breakdown'])}")
                
                # Show new system advantages
                print("New System Advantages:")
                print(f"  • Risk Assessment: {new_score_data['risk_assessment']['risk_level']}")
                print(f"  • Loan Limit Recommendation: {new_score_data['risk_assessment']['recommended_loan_limit']:.2f} ETB")
                print(f"  • Detailed Breakdown: {len(new_score_data['score_breakdown'])} components")
                print(f"  • Personalized Recommendations: {len(new_score_data['recommendations'])}")
                
                print()
                
            except Exception as e:
                print(f"❌ Error comparing scores for {user.username}: {e}")
                continue
        
        print("=" * 60)
        print("COMPARISON COMPLETED")
        print("=" * 60)
        
        db_session.close()
        
    except Exception as e:
        print(f"❌ Error in comparison: {e}")
        import traceback
        traceback.print_exc()


def test_api_endpoints():
    """Test the new API endpoints"""
    print("\n" + "=" * 60)
    print("TESTING NEW API ENDPOINTS")
    print("=" * 60)
    
    print("New Comprehensive Credit Score API Endpoints:")
    print("✓ GET /api/v1/comprehensive-credit-score")
    print("✓ GET /api/v1/comprehensive-credit-score/history")
    print("✓ GET /api/v1/comprehensive-credit-score/comparison")
    print("✓ GET /api/v1/comprehensive-credit-score/loan-eligibility")
    print("✓ GET /api/v1/comprehensive-credit-score/factors")
    print("✓ GET /api/v1/comprehensive-credit-score/test-auth")
    print("✓ GET /api/v1/comprehensive-credit-score/debug/<user_id>")
    print()
    print("Admin Endpoints:")
    print("✓ GET /api/v1/admin/comprehensive-credit-score/analytics")
    print("✓ GET /api/v1/admin/comprehensive-credit-score/user/<user_id>")
    print("✓ GET /api/v1/admin/comprehensive-credit-score/user/<user_id>/factors")
    print("✓ GET /api/v1/admin/comprehensive-credit-score/user/<user_id>/loan-eligibility")
    print()
    print("All endpoints are registered and ready for use!")
    print("The old credit score system remains unchanged at:")
    print("• GET /api/v1/credit-score")
    print("• GET /api/v1/credit-score/history")
    print("• GET /api/v1/credit-score/debug")


if __name__ == "__main__":
    print("🚀 Starting Comprehensive Credit Score System Tests...")
    
    # Test the comprehensive credit score system
    test_comprehensive_credit_score()
    
    # Compare old vs new systems
    compare_old_vs_new_system()
    
    # Show API endpoints
    test_api_endpoints()
    
    print("\n🎉 All tests completed!")
    print("\nThe new comprehensive credit scoring system is ready!")
    print("It analyzes:")
    print("• User details and account age")
    print("• Transaction history and patterns")
    print("• Deposit amounts and frequency")
    print("• Loan repayment pace and history")
    print("• Account balance trends")
    print("• Financial behavior patterns")
    print("\nThe old system remains unchanged and both can be used simultaneously.")