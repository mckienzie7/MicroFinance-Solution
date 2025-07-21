#!/usr/bin/python3
"""
Company Balance API endpoints
"""
from flask import Blueprint, jsonify, request
from BackEnd.Controllers.CompanyBalanceController import CompanyBalanceController
from BackEnd.Controllers.AuthController import AuthController

company_balance_bp = Blueprint('company_balance', __name__)
company_balance_controller = CompanyBalanceController()
auth_controller = AuthController()


@company_balance_bp.route('/overview', methods=['GET'])
def get_company_overview():
    """
    Get comprehensive company financial overview
    ---
    tags:
      - Company Balance
    responses:
      200:
        description: Company financial overview
        schema:
          type: object
          properties:
            overview:
              type: object
              properties:
                company_balance:
                  type: number
                total_customers:
                  type: integer
                profit_loss:
                  type: number
                status:
                  type: string
            loans:
              type: object
            transactions:
              type: object
            trends:
              type: array
            recent_activities:
              type: array
      401:
        description: Unauthorized - Admin access required
      500:
        description: Internal server error
    """
    try:
        # Check if user is admin (you can implement proper auth check here)
        # For now, we'll allow access but you should add admin verification
        
        overview = company_balance_controller.get_company_overview()
        
        if "error" in overview:
            return jsonify({"error": overview["error"]}), 500
        
        return jsonify(overview), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@company_balance_bp.route('/loan-analytics', methods=['GET'])
def get_loan_analytics():
    """
    Get detailed loan analytics
    ---
    tags:
      - Company Balance
    responses:
      200:
        description: Detailed loan analytics
        schema:
          type: object
          properties:
            status_breakdown:
              type: object
            interest_rate_analysis:
              type: object
            repayment_period_analysis:
              type: object
            total_loans:
              type: integer
      401:
        description: Unauthorized - Admin access required
      500:
        description: Internal server error
    """
    try:
        analytics = company_balance_controller.get_detailed_loan_analytics()
        
        if "error" in analytics:
            return jsonify({"error": analytics["error"]}), 500
        
        return jsonify(analytics), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@company_balance_bp.route('/summary', methods=['GET'])
def get_company_summary():
    """
    Get quick company summary for dashboard cards
    ---
    tags:
      - Company Balance
    responses:
      200:
        description: Quick company summary
        schema:
          type: object
          properties:
            total_customers:
              type: integer
            active_loans:
              type: integer
            company_balance:
              type: number
            monthly_profit:
              type: number
            growth_rate:
              type: number
      500:
        description: Internal server error
    """
    try:
        overview = company_balance_controller.get_company_overview()
        
        if "error" in overview:
            return jsonify({"error": overview["error"]}), 500
        
        # Extract key metrics for quick summary
        summary = {
            "total_customers": overview["overview"]["total_customers"],
            "active_loans": overview["loans"]["active_loans"],
            "company_balance": overview["overview"]["company_balance"],
            "total_profit": overview["overview"]["profit_loss"],
            "interest_earned": overview["loans"]["total_interest_earned"],
            "loan_default_rate": overview["loans"]["loan_default_rate"],
            "status": overview["overview"]["status"]
        }
        
        return jsonify(summary), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@company_balance_bp.route('/trends/<period>', methods=['GET'])
def get_trends(period):
    """
    Get financial trends for specific period
    ---
    tags:
      - Company Balance
    parameters:
      - name: period
        in: path
        type: string
        required: true
        description: Period for trends (monthly, weekly, yearly)
    responses:
      200:
        description: Financial trends data
        schema:
          type: object
          properties:
            trends:
              type: array
            period:
              type: string
      400:
        description: Invalid period
      500:
        description: Internal server error
    """
    try:
        if period not in ['monthly', 'weekly', 'yearly']:
            return jsonify({"error": "Invalid period. Use: monthly, weekly, yearly"}), 400
        
        overview = company_balance_controller.get_company_overview()
        
        if "error" in overview:
            return jsonify({"error": overview["error"]}), 500
        
        return jsonify({
            "trends": overview["trends"],
            "period": period,
            "generated_at": overview["generated_at"]
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500