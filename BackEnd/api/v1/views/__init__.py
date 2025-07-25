#!/usr/bin/python3
""" Blueprint for API """
from flask import Blueprint

app_views = Blueprint('app_views', __name__, template_folder='../templates')

from BackEnd.api.v1.views.index import *
from BackEnd.api.v1.views.accounts import *
from BackEnd.api.v1.views.users import *
from BackEnd.api.v1.views.transactions import *
from BackEnd.api.v1.views.loans import *
from BackEnd.api.v1.views.repayments import *
from BackEnd.api.v1.views.stripe import *
from BackEnd.api.v1.views.credit_score import *
from BackEnd.api.v1.views.comprehensive_credit_score import *
from BackEnd.api.v1.views.notifications import * 

