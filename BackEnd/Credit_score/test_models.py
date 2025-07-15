import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler

# Load test data
df = pd.read_csv('./BackEnd/Credit_score/data/test_data.csv', usecols=[
    'account_age_days',
    'total_balance',
    'transaction_count',
    'deposit_count',
    'withdrawal_count',
    'avg_transaction_amount',
    'total_deposits',
    'total_withdrawals',
    'loan_count',
    'total_loan_amount',
    'avg_loan_amount',
    'repaid_loans',
    'outstanding_loans',
    'repayment_ratio',
    'days_since_last_transaction',
    'balance_volatility',
    'loan_to_deposit_ratio',
    'account_utilization',
    'payment_consistency',
    'overdraft_usage'
])
df.replace([float('inf'), float('-inf')], pd.NA, inplace=True)
df = df.fillna(0)

# Initialize and fit the scaler on the test data
scaler = StandardScaler()
df_scaled = scaler.fit_transform(df)

# Load pre-trained models
rf_model = joblib.load('BackEnd/Credit_score/trained_models/random_forest_model.pkl')
xgb_model = joblib.load('BackEnd/Credit_score/trained_models/xgboost_model.pkl')

# Make predictions using both models
rf_preds = rf_model.predict(df_scaled)
xgb_preds = xgb_model.predict(df_scaled)

# Compute final ensemble scores
final_scores = []
for i in range(len(df)):
    rf = rf_preds[i]
    xgb = xgb_preds[i]

    if abs(rf - xgb) > 100:
        score= min(rf,xgb)
    else:
        # Weighted average of predictions
        score = 0.7 * rf + 0.3 * xgb
    # Clamp score between 300 and 850
    score = max(300, min(850, score))
    final_scores.append(round(score))

# Output results for each customer
for idx, score in enumerate(final_scores, 1):
    print(f"Customer {idx}: Predicted Credit Score = {score}")
    print(f"  RF prediction: {rf_preds[idx - 1]}")
    print(f"  XGB prediction: {xgb_preds[idx - 1]}")



### RESULTS ###
# Customer 1: Predicted Credit Score = 414
#   RF prediction: 550.423369565219
#   XGB prediction: 414.41290283203125
# Customer 2: Predicted Credit Score = 408
#   RF prediction: 550.423369565219
#   XGB prediction: 407.9971923828125
# Customer 3: Predicted Credit Score = 376
#   RF prediction: 549.8255434782628
#   XGB prediction: 376.15240478515625
# Customer 4: Predicted Credit Score = 474
#   RF prediction: 498.34673913043866
#   XGB prediction: 418.25030517578125
# Customer 5: Predicted Credit Score = 472
#   RF prediction: 489.31956521739505
#   XGB prediction: 432.3612976074219
# Customer 6: Predicted Credit Score = 500
#   RF prediction: 497.69510869565465
#   XGB prediction: 504.8027648925781
# Customer 7: Predicted Credit Score = 433
#   RF prediction: 560.8195652173918
#   XGB prediction: 433.4799499511719
# Customer 8: Predicted Credit Score = 451
#   RF prediction: 467.265760869566
#   XGB prediction: 413.615234375
# Customer 9: Predicted Credit Score = 565
#   RF prediction: 549.873369565218
#   XGB prediction: 600.8108520507812
# Customer 10: Predicted Credit Score = 531
#   RF prediction: 551.10489130435
#   XGB prediction: 483.3995056152344
# Customer 11: Predicted Credit Score = 535
#   RF prediction: 551.3918478260898
#   XGB prediction: 495.4370422363281
# Customer 12: Predicted Credit Score = 626
#   RF prediction: 625.9288043478311
#   XGB prediction: 754.6139526367188
# Customer 13: Predicted Credit Score = 467
#   RF prediction: 489.31956521739505
#   XGB prediction: 416.54888916015625
# Customer 14: Predicted Credit Score = 482
#   RF prediction: 471.1755434782622
#   XGB prediction: 508.15789794921875
# Customer 15: Predicted Credit Score = 505
#   RF prediction: 498.0059782608721
#   XGB prediction: 520.1300659179688
# Customer 16: Predicted Credit Score = 405
#   RF prediction: 550.7880434782631
#   XGB prediction: 404.5244445800781
# Customer 17: Predicted Credit Score = 591
#   RF prediction: 569.2788043478287
#   XGB prediction: 642.4937133789062
# Customer 18: Predicted Credit Score = 426
#   RF prediction: 552.4141304347843
#   XGB prediction: 425.505615234375
# Customer 19: Predicted Credit Score = 589
#   RF prediction: 589.3418478260922
#   XGB prediction: 774.4354858398438
# Customer 20: Predicted Credit Score = 412
#   RF prediction: 556.5271739130443
#   XGB prediction: 411.886474609375