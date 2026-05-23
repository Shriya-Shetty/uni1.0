BANK_PRODUCTS = [
    "UPI", "Credit Card", "Debit Card", "ATM", "Internet Banking", 
    "Mobile Banking", "Loans", "Savings Account", "Current Account", 
    "Cheque Services", "Fixed Deposit", "Recurring Deposit", 
    "Insurance", "Demat / Trading Account", "Forex / International Transactions", 
    "Wallet / Prepaid Card", "NEFT / RTGS / IMPS", "Customer Service", 
    "Branch Services", "KYC / AML / Compliance", "Pension / Government Schemes", 
    "Lockers", "Business Banking / Current Account", "Merchant Services / POS", 
    "Agriculture / Priority Sector Loans"
]

ISSUE_TYPES = {
    "Transaction Failure": [
        "Amount Deducted Not Reversed", "Payment Pending", "Duplicate Debit", 
        "Beneficiary Not Credited", "Transaction Timed Out", "Wrong Account Credited", 
        "Partial Amount Transferred", "Double Charge on Same Transaction", 
        "Refund Not Received", "Cashback Not Credited", "Reward Points Not Credited", 
        "EMI Not Processed", "Standing Instruction Failed", "Auto-Debit Failed", 
        "Scheduled Transfer Not Executed"
    ],
    "Fraud & Unauthorized Activity": [
        "Unauthorized Transaction", "Phishing / Vishing Attack", "SIM Swap Fraud", 
        "Card Skimming / Cloning", "OTP Fraud", "Account Takeover", 
        "Cyber Fraud / Online Scam", "Identity Theft", "Unauthorized Loan Taken", 
        "Mule Account Activity", "Deepfake / Social Engineering Fraud", 
        "QR Code Fraud", "Fake UPI Collect Request", "Investment Fraud via Bank Channel", 
        "Impersonation of Bank Staff"
    ],
    "Technical Issue": [
        "App Crash", "Login Failure", "Server Downtime", "OTP Not Received", 
        "Biometric Authentication Failure", "Session Timeout", "Transaction History Not Loading", 
        "Statement Download Failure", "Beneficiary Add Failed", "IFSC / Account Validation Error", 
        "Push Notification Not Working", "App Update Breaking Features", 
        "Two-Factor Authentication Issue", "Net Banking Portal Not Accessible", "UPI App Linking Failure"
    ],
    "Account Services": [
        "Account Freeze / Hold", "Unauthorized Account Closure", "Account Closure Delay", 
        "Wrong Balance Shown", "Account Not Activated", "Nominee Update Issue", 
        "Joint Account Dispute", "Minor Account Conversion Delay", "Dormant Account Reactivation Issue", 
        "Savings to Current Account Conversion Issue", "Account Merge Request Delay", 
        "Sweep Account Issue", "Overdraft Limit Not Applied", "Interest Not Credited", "TDS Incorrectly Deducted"
    ],
    "KYC / Compliance": [
        "KYC Update Rejected", "KYC Expiry Notice Despite Submission", "PAN Linking Issue", 
        "Aadhaar Linking Failure", "Video KYC Failure", "Re-KYC Demand Without Reason", 
        "FATCA / CRS Non-Compliance Flag", "AML Hold on Account", "CERSAI Registration Issue", 
        "Form 15G / 15H Not Updated", "Incorrect CIBIL Reporting by Bank", "CKYC Registry Mismatch"
    ],
    "Card Services": [
        "Card Not Received After Request", "Card Delivery to Wrong Address", 
        "Card Blocked Without Notice", "Card Unblocking Delay", "PIN Generation Failure", 
        "Contactless Payment Not Working", "Card Limit Not Updated", "Add-on Card Issue", 
        "Virtual Card Creation Failure", "Card Upgrade Not Processed", "Card Downgrade Without Consent", 
        "International Transaction Blocked", "Card Compromised Replacement Delay"
    ],
    "Loan Complaints": [
        "Loan Rejection Without Reason", "Wrong EMI Deduction", "Excess Interest Charged", 
        "Foreclosure Not Processed", "Foreclosure Charges Dispute", 
        "NOC Not Issued After Full Repayment", "CIBIL Not Updated After Loan Closure", 
        "Loan Processing Delay", "Disbursement Not Done", "Partial Disbursement Without Consent", 
        "Coercive Recovery Calls", "Recovery Agent Harassment", "Guarantor Harassment", 
        "Restructuring Request Rejected", "Moratorium Not Applied", "Insurance Mis-sold with Loan", 
        "Pre-payment Penalty Dispute", "Top-up Loan Rejected Without Reason"
    ],
    "Fixed Deposit / Recurring Deposit": [
        "FD Maturity Amount Not Credited", "Premature Withdrawal Rejected", 
        "Wrong Interest Rate Applied", "Auto-Renewal Done Without Consent", 
        "Auto-Renewal Not Done Despite Instruction", "TDS Deducted Incorrectly on FD", 
        "RD Installment Not Deducted", "RD Closure Issue", "FD Certificate Not Issued"
    ],
    "Insurance": [
        "Premium Deducted But Policy Not Issued", "Claim Rejected Without Reason", 
        "Claim Processing Delay", "Policy Lapsed Despite Premium Payment", 
        "Wrong Nominee Recorded", "Mis-sold Insurance Product", "Policy Cancellation Not Processed", 
        "Maturity Amount Not Credited", "Double Premium Deduction", "Health Insurance Cashless Denial"
    ],
    "Demat / Trading": [
        "Shares Not Credited After Purchase", "Shares Debited Without Trade", 
        "Wrong NAV Applied", "DP Charges Incorrectly Applied", "Account Freeze by Depository", 
        "Pledge / Unpledge Failure", "Demat Account Not Opened Despite Documents", 
        "Nomination Not Updated", "Transfer of Securities Failed", "IPO Refund Not Received", 
        "SIP Start / Stop Failure"
    ],
    "Forex / International": [
        "Wrong Exchange Rate Applied", "International Transaction Blocked", 
        "Forex Card Loading Failure", "Remittance Not Received by Beneficiary", 
        "Swift Charges Not Disclosed", "FEMA Violation Flag Without Reason", 
        "Foreign Currency Cash Not Provided", "Inward Remittance Credit Delayed", 
        "Outward Remittance Rejected"
    ],
    "Cheque Services": [
        "Cheque Bounce Due to Bank Error", "Cheque Clearance Delay", "Wrong Account Debited", 
        "Stop Payment Not Executed", "Cheque Book Not Delivered", 
        "Cheque Dishonored Despite Sufficient Balance", "ECS Return Dispute", 
        "NACH Mandate Not Registered", "NACH Cancellation Not Processed"
    ],
    "NEFT / RTGS / IMPS": [
        "NEFT Transfer Delayed Beyond RBI Timeline", "RTGS Amount Not Credited to Beneficiary", 
        "IMPS Failure With Amount Deducted", "Wrong Beneficiary Credited", 
        "Transfer Reversed Without Reason", "NEFT Returned But Not Credited Back", 
        "Bulk Transfer Partially Processed"
    ],
    "ATM": [
        "Cash Not Dispensed But Account Debited", "Card Retained by ATM", 
        "Wrong Amount Dispensed", "ATM Machine Out of Service", "ATM Receipt Not Issued", 
        "Cash Deposited at CDM Not Credited", "ATM Fraud / Skimming", "Balance Mismatch at ATM", 
        "Foreign ATM Surcharge Dispute", "ATM PIN Change Failure"
    ],
    "Customer Service": [
        "Call Centre Not Responding", "Rude / Abusive Staff Behavior", 
        "Misleading Information Given by Agent", "Complaint Not Registered by Branch", 
        "Complaint Closed Without Resolution", "Repeated Follow-up Required", 
        "Incorrect Advice Leading to Financial Loss", "Callback Not Received After Promise", 
        "Grievance Officer Not Accessible", "Long Queue / Waiting Time at Branch", 
        "Discriminatory Treatment", "Senior Citizen / Differently Abled Not Assisted"
    ],
    "Branch Services": [
        "Branch Not Providing Services", "Passbook Not Updated", "Passbook / Statement Not Issued", 
        "Document Submission Not Acknowledged", "Request Form Not Accepted", 
        "Wrong Address / Name in Records", "Locker Access Denied", "Locker Operation Issue", 
        "Safe Custody Article Issue", "Branch Timing Dispute"
    ],
    "Government / Pension Schemes": [
        "PM Jan Dhan Account Issue", "Pension Credit Delayed", "PMJJBY / PMSBY Claim Rejected", 
        "Mudra Loan Rejected Without Reason", "DBT Credit Not Received", "Subsidy Not Credited", 
        "EPFO Withdrawal Through Bank Issue", "Senior Citizen Scheme Interest Dispute", 
        "NPS Contribution Not Updated", "SSY / PPF Deposit Not Credited"
    ],
    "Merchant / POS Services": [
        "POS Terminal Not Settled", "Chargeback Not Processed", "MDR Charges Dispute", 
        "POS Machine Not Working", "Merchant Account Freeze", "Settlement Delay", 
        "Wrong Amount Charged at POS", "Contactless POS Double Charge"
    ]
}

BASE_SEVERITY = {
    "Unauthorized Transaction": 10, "Fraud": 10, "Phishing / Vishing Attack": 10,
    "SIM Swap Fraud": 10, "OTP Fraud": 10, "Account Takeover": 10,
    "Cyber Fraud / Online Scam": 10, "Identity Theft": 10, "Mule Account Activity": 10,
    "Coercive Recovery Calls": 9, "Recovery Agent Harassment": 9, "ATM Fraud / Skimming": 10,
    "Wrong Amount Dispensed": 9, "Cash Deposited at CDM Not Credited": 9,
    "Investment Fraud via Bank Channel": 10, "Health Insurance Cashless Denial": 9,
    "Claim Rejected Without Reason": 9, "DBT Credit Not Received": 9,
    "Pension Credit Delayed": 9, "CIBIL Not Updated After Loan Closure": 9,
    "Amount Deducted Not Reversed": 8, "Cash Not Dispensed But Account Debited": 8,
    "Account Freeze / Hold": 8, "AML Hold on Account": 8, "Wrong EMI Deduction": 8,
    "Loan Processing Delay": 7, "Disbursement Not Done": 8,
    "NOC Not Issued After Full Repayment": 7, "RTGS Amount Not Credited to Beneficiary": 8,
    "IMPS Failure With Amount Deducted": 8, "NEFT Transfer Delayed Beyond RBI Timeline": 7,
    "Cheque Bounce Due to Bank Error": 8, "Wrong Account Debited": 8,
    "Foreclosure Not Processed": 7, "FD Maturity Amount Not Credited": 8,
    "Unauthorized Account Closure": 8, "Premium Deducted But Policy Not Issued": 8,
    "Double Premium Deduction": 8, "Shares Debited Without Trade": 8,
    "Wrong Exchange Rate Applied": 7, "International Transaction Blocked": 7,
    "KYC Update Rejected": 7, "Incorrect CIBIL Reporting by Bank": 8,
    "Misleading Information Given by Agent": 7, "Incorrect Advice Leading to Financial Loss": 8,
    "Remittance Not Received by Beneficiary": 8, "Locker Access Denied": 7,
    "Discriminatory Treatment": 7, "Senior Citizen / Differently Abled Not Assisted": 7,
    "Payment Pending": 5, "Duplicate Debit": 6, "Beneficiary Not Credited": 6,
    "Refund Not Received": 5, "Card Blocked Without Notice": 6, "Card Unblocking Delay": 5,
    "Login Failure": 4, "OTP Not Received": 5, "Account Not Activated": 5,
    "Premature Withdrawal Rejected": 5, "Complaint Closed Without Resolution": 6,
    "NACH Mandate Not Registered": 5, "Standing Instruction Failed": 5,
    "EMI Not Processed": 6, "Policy Lapsed Despite Premium Payment": 6,
    "Claim Processing Delay": 6, "Foreclosure Charges Dispute": 5,
    "Pre-payment Penalty Dispute": 5, "Forex Card Loading Failure": 5,
    "IPO Refund Not Received": 6, "SIP Start / Stop Failure": 4,
    "Cheque Clearance Delay": 5, "Stop Payment Not Executed": 6
}

SLA_DAYS = {
    "Critical": 1,
    "High": 3,
    "Medium": 7,
    "Low": 15
}

SIMILARITY_CONFIG = {
    "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
    "vector_store": "FAISS",
    "similarity_metric": "cosine",
    "duplicate_threshold": 0.92,
    "related_threshold": 0.78,
    "cluster_window_days": 7
}
