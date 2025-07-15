import React, { useState, useEffect, useRef } from 'react';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  ChartBarIcon,
  LightBulbIcon,
  BanknotesIcon,
  CreditCardIcon,
  CalculatorIcon,
  UserIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const AIFinancialChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userAccounts, setUserAccounts] = useState([]);
  const [userLoans, setUserLoans] = useState([]);
  const [creditScore, setCreditScore] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    // Component initialization
  }, [user]);

  const categories = [
    {
      id: 'savings',
      name: 'Savings & Budgeting',
      icon: BanknotesIcon,
      color: 'text-green-600 bg-green-100',
      description: 'Tips for saving money and budgeting'
    },
    {
      id: 'loans',
      name: 'Loans & Credit',
      icon: CreditCardIcon,
      color: 'text-blue-600 bg-blue-100',
      description: 'Loan advice and credit improvement'
    },
    {
      id: 'investments',
      name: 'Investment Guidance',
      icon: ChartBarIcon,
      color: 'text-purple-600 bg-purple-100',
      description: 'Investment strategies and advice'
    },
    {
      id: 'calculator',
      name: 'Financial Calculator',
      icon: CalculatorIcon,
      color: 'text-orange-600 bg-orange-100',
      description: 'Calculate loans, savings, and more'
    },
    {
      id: 'account',
      name: 'Account Help',
      icon: UserIcon,
      color: 'text-indigo-600 bg-indigo-100',
      description: 'Account management and support'
    },
    {
      id: 'general',
      name: 'General Financial Advice',
      icon: LightBulbIcon,
      color: 'text-yellow-600 bg-yellow-100',
      description: 'General financial guidance and tips'
    }
  ];

  const quickActions = [
    { text: "What's my credit score?", category: 'account' },
    { text: "Get AI financial health analysis", category: 'general' },
    { text: "Calculate loan payment", category: 'calculator' },
    { text: "Saving tips for beginners", category: 'savings' },
    { text: "Check my account balance", category: 'account' },
    { text: "Investment options", category: 'investments' }
  ];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize chatbot with welcome message
      const welcomeMessage = {
        id: Date.now(),
        type: 'bot',
        content: `Hello ${user?.fullname || 'there'}! 👋 I'm your AI Financial Assistant. I'm here to help you with:\n\n• Savings and budgeting advice\n• Loan and credit guidance\n• Investment recommendations\n• Financial calculations\n• Account management\n\nHow can I help you today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      // Fetch user data
      fetchUserData();
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUserData = async () => {
    try {
      // Fetch user accounts
      const accountsResponse = await api.get('/api/v1/accounts/me');
      setUserAccounts(accountsResponse.data || []);

      // Fetch user loans
      const loansResponse = await api.get('/api/v1/loans');
      setUserLoans(loansResponse.data || []);

      // Fetch credit score
      try {
        const creditResponse = await api.get('/api/v1/credit-score');
        setCreditScore(creditResponse.data);
      } catch (err) {
        console.log('Credit score not available');
      }

      // Fetch AI analysis for enhanced recommendations
      try {
        const analysisResponse = await api.get('/api/v1/ai-analysis');
        setUserProfile(analysisResponse.data);
      } catch (err) {
        console.log('AI analysis not available');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = async (userMessage, category = null) => {
    setIsTyping(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    let response = '';
    const lowerMessage = userMessage.toLowerCase();

    // Context-aware responses based on user data
    const userContext = {
      hasAccounts: userAccounts.length > 0,
      totalBalance: userAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0),
      hasLoans: userLoans.length > 0,
      creditScore: creditScore?.credit_score || null,
      creditRating: creditScore?.score_rating || null
    };

    if (category === 'account' || lowerMessage.includes('credit score') || lowerMessage.includes('score')) {
      if (userContext.creditScore) {
        response = `📊 Your current credit score is **${userContext.creditScore}** (${userContext.creditRating})\n\n`;
        
        if (userContext.creditScore >= 750) {
          response += "🎉 Excellent score! You qualify for the best loan rates and terms. Consider:\n• Premium investment options\n• Low-interest personal loans\n• Credit limit increases";
        } else if (userContext.creditScore >= 650) {
          response += "👍 Good score! You have access to competitive rates. To improve further:\n• Pay bills on time consistently\n• Keep credit utilization below 30%\n• Consider a secured credit card";
        } else {
          response += "📈 There's room for improvement. Here's how to boost your score:\n• Set up automatic payments\n• Pay down existing debt\n• Avoid new credit applications\n• Consider credit counseling";
        }
      } else {
        response = "I'd love to help with your credit score, but I need to fetch that information first. Your credit score is an important factor in:\n\n• Loan approvals\n• Interest rates\n• Credit limits\n\nWould you like me to check if your score is available?";
      }
    }
    
    else if (category === 'savings' || lowerMessage.includes('save') || lowerMessage.includes('budget')) {
      response = `💰 **Personalized Savings Advice**\n\n`;
      
      if (userContext.hasAccounts) {
        response += `Current total balance: $${userContext.totalBalance.toFixed(2)}\n\n`;
      }
      
      response += `**Smart Saving Strategies:**\n\n`;
      response += `🎯 **50/30/20 Rule**: Allocate 50% needs, 30% wants, 20% savings\n\n`;
      response += `📱 **Automated Savings**: Set up automatic transfers on payday\n\n`;
      response += `🏦 **High-Yield Savings**: Consider accounts with better interest rates\n\n`;
      response += `📊 **Emergency Fund**: Aim for 3-6 months of expenses\n\n`;
      
      if (userContext.totalBalance < 1000) {
        response += `**Quick Start Tips:**\n• Start with $25/week\n• Use the envelope method\n• Track every expense for a week`;
      } else {
        response += `**Advanced Strategies:**\n• Invest in index funds\n• Consider a CD ladder\n• Explore retirement accounts`;
      }
    }
    
    else if (category === 'loans' || lowerMessage.includes('loan') || lowerMessage.includes('borrow')) {
      response = `🏦 **Loan & Credit Guidance**\n\n`;
      
      if (userContext.hasLoans) {
        response += `You currently have ${userLoans.length} active loan(s).\n\n`;
      }
      
      response += `**Before Taking a Loan:**\n`;
      response += `✅ Check your debt-to-income ratio\n`;
      response += `✅ Compare rates from multiple lenders\n`;
      response += `✅ Understand all fees and terms\n\n`;
      
      response += `**Loan Types Available:**\n`;
      response += `🏠 **Personal Loans**: 6-12% APR, up to $50,000\n`;
      response += `🚗 **Auto Loans**: 3-8% APR, vehicle as collateral\n`;
      response += `🎓 **Education Loans**: Low rates, flexible repayment\n\n`;
      
      if (userContext.creditScore) {
        if (userContext.creditScore >= 700) {
          response += `With your credit score of ${userContext.creditScore}, you qualify for our best rates! 🌟`;
        } else {
          response += `To get better rates, consider improving your credit score first.`;
        }
      }
    }
    
    else if (category === 'calculator' || lowerMessage.includes('calculate') || lowerMessage.includes('payment')) {
      // Enhanced calculator with backend API integration
      if (lowerMessage.includes('loan') && (lowerMessage.includes('10000') || lowerMessage.includes('$10'))) {
        try {
          const calcResponse = await api.post('/api/v1/calculate', {
            type: 'loan_payment',
            principal: 10000,
            annual_rate: 8,
            term_months: 36
          });
          
          const results = calcResponse.data.results;
          response = `🧮 **Loan Calculation Result**\n\n`;
          response += `**Loan Details:**\n`;
          response += `• Principal: $${(10000).toLocaleString()}\n`;
          response += `• Interest Rate: 8% APR\n`;
          response += `• Term: 3 years (36 months)\n\n`;
          response += `**Results:**\n`;
          response += `• Monthly Payment: $${results.monthly_payment}\n`;
          response += `• Total Interest: $${results.total_interest}\n`;
          response += `• Total Amount Paid: $${results.total_payment}\n\n`;
          response += `💡 **Pro Tip**: Making an extra payment of $50/month would save you approximately $${(results.total_interest * 0.15).toFixed(2)} in interest!`;
        } catch (err) {
          response = `🧮 **Loan Calculation (Estimated)**\n\nFor a $10,000 loan at 8% APR for 3 years:\n• Monthly Payment: ~$313\n• Total Interest: ~$1,281\n\n💡 Contact us for precise calculations based on your profile!`;
        }
      } else if (lowerMessage.includes('savings') && lowerMessage.includes('500')) {
        try {
          const calcResponse = await api.post('/api/v1/calculate', {
            type: 'savings_growth',
            initial_amount: 0,
            monthly_deposit: 500,
            annual_rate: 4,
            years: 5
          });
          
          const results = calcResponse.data.results;
          response = `📈 **Savings Growth Calculation**\n\n`;
          response += `**Savings Plan:**\n`;
          response += `• Monthly Deposit: $500\n`;
          response += `• Interest Rate: 4% APY\n`;
          response += `• Time Period: 5 years\n\n`;
          response += `**Results:**\n`;
          response += `• Final Amount: $${results.final_amount}\n`;
          response += `• Total Deposits: $${results.total_deposits}\n`;
          response += `• Interest Earned: $${results.total_interest}\n\n`;
          response += `🚀 **Amazing!** Your money will grow by $${results.total_interest} through compound interest!`;
        } catch (err) {
          response = `📈 **Savings Growth (Estimated)**\n\nSaving $500/month at 4% APY for 5 years:\n• Final Amount: ~$33,175\n• Interest Earned: ~$3,175\n\n🚀 The power of compound interest!`;
        }
      } else {
        response = `🧮 **Financial Calculator**\n\n`;
        response += `I can help you calculate:\n\n`;
        response += `💳 **Loan Payments**: Monthly payment for any loan amount\n`;
        response += `📈 **Savings Growth**: How your savings will grow over time\n`;
        response += `🏠 **Mortgage Payments**: Home loan calculations\n`;
        response += `📊 **Investment Returns**: Potential investment growth\n`;
        response += `💰 **Emergency Fund**: How much you need to save\n`;
        response += `🎯 **Debt Payoff**: Time to pay off credit cards\n\n`;
        response += `**Quick Calculations:**\n`;
        response += `• "Calculate loan payment for $10,000"\n`;
        response += `• "How much will $500/month savings grow?"\n`;
        response += `• "Emergency fund for $3,000 monthly expenses"\n\n`;
        response += `Just tell me what you'd like to calculate with specific amounts!`;
      }
    }
    
    else if (category === 'investments' || lowerMessage.includes('invest') || lowerMessage.includes('portfolio')) {
      response = `📈 **Investment Guidance**\n\n`;
      
      if (userContext.totalBalance > 5000) {
        response += `With your current balance, you're ready to start investing! 🎉\n\n`;
      } else {
        response += `Building an emergency fund first is wise before investing.\n\n`;
      }
      
      response += `**Investment Options by Risk Level:**\n\n`;
      response += `🟢 **Low Risk (Beginner)**:\n`;
      response += `• High-yield savings accounts (2-4% APY)\n`;
      response += `• CDs and Treasury bonds\n`;
      response += `• Index funds (S&P 500)\n\n`;
      
      response += `🟡 **Medium Risk**:\n`;
      response += `• Diversified mutual funds\n`;
      response += `• ETFs (Exchange Traded Funds)\n`;
      response += `• Real estate investment trusts\n\n`;
      
      response += `🔴 **Higher Risk**:\n`;
      response += `• Individual stocks\n`;
      response += `• Cryptocurrency (small allocation)\n`;
      response += `• Growth stocks\n\n`;
      
      response += `**Golden Rules:**\n`;
      response += `✨ Start early, invest regularly\n`;
      response += `✨ Diversify your portfolio\n`;
      response += `✨ Don't invest money you need soon`;
    }
    
    else if (lowerMessage.includes('balance') || lowerMessage.includes('account')) {
      if (userContext.hasAccounts) {
        response = `💼 **Your Account Summary**\n\n`;
        userAccounts.forEach((account, index) => {
          response += `**Account ${index + 1}** (${account.account_type || 'Savings'})\n`;
          response += `Balance: $${(account.balance || 0).toFixed(2)}\n`;
          response += `Status: ${account.status || 'Active'}\n\n`;
        });
        response += `**Total Balance**: $${userContext.totalBalance.toFixed(2)}`;
      } else {
        response = `I don't see any accounts linked to your profile yet. Would you like help setting up a savings account? Our accounts offer:\n\n• No monthly fees\n• Competitive interest rates\n• Mobile banking\n• 24/7 customer support`;
      }
    }
    
    else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      response = `🆘 **How I Can Help You**\n\n`;
      response += `I'm your personal financial assistant! Here's what I can do:\n\n`;
      response += `💰 **Financial Planning**: Budgeting, saving strategies, goal setting\n\n`;
      response += `🏦 **Banking Services**: Account information, transaction help\n\n`;
      response += `💳 **Credit & Loans**: Credit score advice, loan calculations\n\n`;
      response += `📊 **Investments**: Portfolio advice, risk assessment\n\n`;
      response += `🧮 **Calculations**: Loan payments, savings growth, ROI\n\n`;
      response += `🤖 **AI Insights**: Get personalized financial health analysis\n\n`;
      response += `📞 **24/7 Support**: I'm always here to help!\n\n`;
      response += `Just ask me anything about your finances, and I'll provide personalized advice based on your profile.`;
    }
    
    else if (lowerMessage.includes('financial health') || lowerMessage.includes('analysis') || lowerMessage.includes('insights')) {
      if (userProfile && userProfile.financial_health) {
        const health = userProfile.financial_health;
        response = `🤖 **AI Financial Health Analysis**\n\n`;
        response += `**Your Financial Health Score: ${health.score}/100** (${health.rating})\n\n`;
        
        if (userProfile.ai_recommendations && userProfile.ai_recommendations.length > 0) {
          response += `**🎯 Top AI Recommendations:**\n\n`;
          userProfile.ai_recommendations.slice(0, 3).forEach((rec, index) => {
            response += `**${index + 1}. ${rec.title}** (${rec.priority} Priority)\n`;
            response += `${rec.description}\n\n`;
          });
        }
        
        response += `💡 **Quick Tip**: `;
        if (health.score >= 80) {
          response += `Excellent work! Consider advanced investment strategies to maximize your wealth.`;
        } else if (health.score >= 60) {
          response += `You're on the right track! Focus on building your emergency fund and reducing debt.`;
        } else {
          response += `Let's work together to improve your financial foundation. Start with building a $1,000 emergency fund.`;
        }
      } else {
        response = `🤖 **AI Financial Analysis**\n\n`;
        response += `I'm analyzing your financial profile to provide personalized insights...\n\n`;
        response += `Based on your current data:\n`;
        response += `• Total Balance: $${userContext.totalBalance.toFixed(2)}\n`;
        response += `• Active Accounts: ${userAccounts.length}\n`;
        response += `• Active Loans: ${userLoans.length}\n\n`;
        
        if (userContext.totalBalance < 1000) {
          response += `🎯 **Priority**: Build an emergency fund of $1,000\n`;
          response += `📈 **Impact**: This will improve your financial stability significantly\n`;
          response += `⏱️ **Timeline**: Achievable in 3-6 months with consistent saving\n\n`;
        } else if (userContext.totalBalance > 5000) {
          response += `🎉 **Great job!** You have a solid financial foundation\n`;
          response += `🚀 **Next Step**: Consider investment opportunities to grow your wealth\n`;
          response += `💡 **Tip**: Diversify your portfolio with low-cost index funds\n\n`;
        }
        
        response += `Would you like me to create a personalized action plan for you?`;
      }
    }
    
    else if (lowerMessage.includes('emergency') || lowerMessage.includes('crisis') || lowerMessage.includes('urgent')) {
      response = `🚨 **Emergency Financial Guidance**\n\n`;
      
      if (lowerMessage.includes('lost job') || lowerMessage.includes('unemployed')) {
        response += `**Job Loss Action Plan:**\n\n`;
        response += `🎯 **Immediate Steps (Week 1):**\n`;
        response += `• File for unemployment benefits\n`;
        response += `• Review and cut non-essential expenses\n`;
        response += `• Contact creditors to discuss payment options\n`;
        response += `• Apply for emergency assistance programs\n\n`;
        response += `💰 **Financial Triage:**\n`;
        response += `• Prioritize: Housing, utilities, food, transportation\n`;
        response += `• Use emergency fund if available\n`;
        response += `• Consider temporary gig work\n`;
        response += `• Avoid taking on new debt\n\n`;
        response += `📞 **Resources:**\n`;
        response += `• Local food banks and assistance programs\n`;
        response += `• Utility company hardship programs\n`;
        response += `• Credit counseling services (free)\n`;
      } else if (lowerMessage.includes('medical') || lowerMessage.includes('hospital')) {
        response += `**Medical Emergency Financial Plan:**\n\n`;
        response += `💊 **Immediate Actions:**\n`;
        response += `• Request itemized bills from all providers\n`;
        response += `• Ask about payment plans or financial assistance\n`;
        response += `• Check if you qualify for charity care\n`;
        response += `• Review insurance coverage and appeals process\n\n`;
        response += `💡 **Cost Reduction Strategies:**\n`;
        response += `• Negotiate bills (many hospitals offer 20-50% discounts)\n`;
        response += `• Apply for hospital financial aid programs\n`;
        response += `• Consider medical credit cards (0% intro APR)\n`;
        response += `• Look into prescription assistance programs\n`;
      } else {
        response += `**General Emergency Preparedness:**\n\n`;
        response += `🛡️ **Emergency Fund Goals:**\n`;
        response += `• Starter: $1,000 minimum\n`;
        response += `• Intermediate: 3 months expenses\n`;
        response += `• Full protection: 6 months expenses\n\n`;
        response += `⚡ **Quick Cash Sources:**\n`;
        response += `• Sell unused items\n`;
        response += `• Gig work (rideshare, delivery)\n`;
        response += `• Cash advance from employer\n`;
        response += `• Borrow from retirement (last resort)\n\n`;
        response += `📋 **Emergency Contacts:**\n`;
        response += `• National Suicide Prevention: 988\n`;
        response += `• Financial counseling: 1-800-388-2227\n`;
        response += `• Local 211 for community resources\n`;
      }
    }
    
    else if (lowerMessage.includes('retirement') || lowerMessage.includes('pension')) {
      response = `🏖️ **Retirement Planning Guidance**\n\n`;
      
      if (userContext.totalBalance > 10000) {
        response += `Great job building savings! You're ready for retirement planning. 🎉\n\n`;
      }
      
      response += `**Retirement Savings Strategy:**\n\n`;
      response += `📊 **The 4% Rule**: Plan to withdraw 4% annually in retirement\n`;
      response += `• Need $1M? Save $40,000/year income goal\n`;
      response += `• Need $500K? Save $20,000/year income goal\n\n`;
      
      response += `🎯 **Age-Based Guidelines:**\n`;
      response += `• Age 30: 1x annual salary saved\n`;
      response += `• Age 40: 3x annual salary saved\n`;
      response += `• Age 50: 6x annual salary saved\n`;
      response += `• Age 60: 8x annual salary saved\n\n`;
      
      response += `💰 **Investment Allocation by Age:**\n`;
      response += `• 20s-30s: 80% stocks, 20% bonds\n`;
      response += `• 40s: 70% stocks, 30% bonds\n`;
      response += `• 50s: 60% stocks, 40% bonds\n`;
      response += `• 60s+: 50% stocks, 50% bonds\n\n`;
      
      response += `🚀 **Catch-Up Strategies:**\n`;
      response += `• Maximize employer 401(k) match\n`;
      response += `• Consider Roth IRA conversions\n`;
      response += `• Delay Social Security for higher benefits\n`;
      response += `• Work part-time in early retirement\n`;
    }
    
    else if (lowerMessage.includes('debt') || lowerMessage.includes('payoff')) {
      response = `💳 **Debt Elimination Strategy**\n\n`;
      
      response += `**Choose Your Method:**\n\n`;
      response += `❄️ **Debt Snowball** (Psychological wins):\n`;
      response += `• Pay minimums on all debts\n`;
      response += `• Attack smallest balance first\n`;
      response += `• Roll payments to next smallest\n`;
      response += `• Best for: Motivation and quick wins\n\n`;
      
      response += `⚡ **Debt Avalanche** (Math optimal):\n`;
      response += `• Pay minimums on all debts\n`;
      response += `• Attack highest interest rate first\n`;
      response += `• Roll payments to next highest rate\n`;
      response += `• Best for: Saving money on interest\n\n`;
      
      response += `🎯 **Acceleration Tactics:**\n`;
      response += `• Use windfalls (tax refunds, bonuses)\n`;
      response += `• Pick up side hustles\n`;
      response += `• Sell unused possessions\n`;
      response += `• Consider debt consolidation\n\n`;
      
      if (userContext.totalBalance > 5000) {
        response += `💡 **Your Strategy**: With your current balance, consider paying off high-interest debt first while maintaining a small emergency fund.`;
      }
    }
    
    else {
      // Enhanced general financial advice with personalization
      response = `💡 **Personalized Financial Wisdom**\n\n`;
      
      if (userContext.hasAccounts && userContext.totalBalance > 0) {
        response += `Based on your profile, here's tailored advice:\n\n`;
        
        if (userContext.totalBalance < 1000) {
          response += `🎯 **Priority 1**: Build a $1,000 emergency fund\n`;
          response += `• Save $25-50 per week\n`;
          response += `• Cut one subscription or dining expense\n`;
          response += `• Sell items you don't need\n\n`;
        } else if (userContext.totalBalance < 5000) {
          response += `🎯 **Priority 1**: Expand emergency fund to 3 months expenses\n`;
          response += `• Automate savings transfers\n`;
          response += `• Consider high-yield savings account\n`;
          response += `• Start exploring investment options\n\n`;
        } else {
          response += `🎯 **Priority 1**: Optimize your wealth building\n`;
          response += `• Maximize investment returns\n`;
          response += `• Consider tax-advantaged accounts\n`;
          response += `• Explore real estate or business opportunities\n\n`;
        }
      }
      
      response += `**Universal Financial Principles:**\n\n`;
      response += `🏦 **Pay Yourself First**: Save before spending\n\n`;
      response += `📊 **Track Everything**: You can't manage what you don't measure\n\n`;
      response += `🚫 **Avoid High-Interest Debt**: Credit cards, payday loans\n\n`;
      response += `📈 **Invest for the Long Term**: Time is your greatest asset\n\n`;
      response += `🛡️ **Insurance is Essential**: Protect your financial foundation\n\n`;
      response += `📚 **Never Stop Learning**: Financial education pays dividends\n\n`;
      response += `What specific area would you like to dive deeper into?`;
    }

    setIsTyping(false);
    return response;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Generate AI response
    const aiResponse = await generateAIResponse(inputMessage, selectedCategory);
    
    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: aiResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setSelectedCategory(null);
  };

  const handleQuickAction = async (action) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: action.text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Generate AI response
    const aiResponse = await generateAIResponse(action.text, action.category);
    
    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: aiResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content) => {
    // Convert markdown-style formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 animate-pulse"
          title="Open AI Financial Assistant"
        >
          <div className="relative">
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
            <SparklesIcon className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-96 h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <CpuChipIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">AI Financial Assistant</h3>
                <p className="text-sm opacity-90">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.type === 'bot' ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatMessage(message.content)
                    }}
                  />
                ) : (
                  <p>{message.content}</p>
                )}
                <p className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.slice(0, 4).map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
                >
                  {action.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {selectedCategory === null && messages.length > 1 && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Choose a topic:</p>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-2 rounded-lg text-center transition-colors ${category.color} hover:opacity-80`}
                  >
                    <IconComponent className="h-5 w-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">{category.name.split(' ')[0]}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your finances..."
              className="flex-1 p-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="1"
              style={{ minHeight: '44px', maxHeight: '100px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFinancialChatbot; 