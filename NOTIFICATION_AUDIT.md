# Complete Notification Audit - TradeRefer

## Audit Methodology
Checking every user action/event that should trigger email or SMS notifications.

---

## 1. LEAD LIFECYCLE NOTIFICATIONS

### Lead Creation
- **Event:** Consumer creates a lead via business page
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Business (email + SMS): "New lead enquiry"
  - ❓ Referrer (email + SMS): "Lead created from your link"
  - ❓ Consumer (email): "Lead submitted confirmation"

### Lead Screening (AI SMS Flow)
- **Event:** Consumer replies to screening questions
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Consumer (SMS): Q1, Q2, Q3, follow-up questions
  - ❓ Consumer (SMS): Thank you message when PASS
  - ❓ Consumer (SMS): Wrong category message when FAIL
  - ❓ Business (email + SMS): Lead passed screening
  - ❓ Admin (email): Lead failed screening (QA alert)

### Lead Unlock
- **Event:** Business unlocks a lead
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Consumer (email + SMS): "Business unlocked your details"
  - ❓ Referrer (email + SMS): "Your lead was unlocked - commission earned"
  - ❓ Business (email): "Lead unlocked successfully"

### Business On The Way
- **Event:** Business marks "on the way"
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Consumer (SMS): "Business is on the way with PIN"
  - ❓ Referrer (email): Status update

### PIN Confirmation
- **Event:** Consumer confirms PIN
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Business (email + SMS): "Job confirmed by consumer"
  - ❓ Referrer (email + SMS): "Job confirmed - commission secured"

### Lead Dispute
- **Event:** Business or consumer disputes a lead
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Other party (email + SMS): "Dispute raised"
  - ❓ Admin (email): "Dispute requires review"
  - ❓ Referrer (email): "Dispute may affect commission"

---

## 2. REFERRER NOTIFICATIONS

### Referral Link Created
- **Event:** Referrer creates a new referral link
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Referrer (email): "Link created successfully with tips"
  - ❓ Business (email): "New referrer joined your network"

### Commission Earned
- **Event:** Lead unlocked = commission earned
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Referrer (email + SMS): "You earned $X commission"

### Payout Processed
- **Event:** Referrer withdraws earnings
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Referrer (email + SMS): "Gift card sent"
  - ❓ Admin (email): "Payout processed"

### Quality Score Change
- **Event:** Referrer quality score updated
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Referrer (email): Score increased/decreased with tips

### Screening Failed
- **Event:** Lead fails AI screening
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Referrer (SMS): "Lead didn't pass screening"

---

## 3. BUSINESS NOTIFICATIONS

### New Lead (After Screening PASS)
- **Event:** Lead passes AI screening
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Business (email + SMS): "New qualified lead"

### Lead Unlocked
- **Event:** Business unlocks lead
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Business (email): "Lead details unlocked"

### New Message
- **Event:** Referrer sends message to business
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Business (email + SMS): "New message from referrer"

### New Referrer Linked
- **Event:** Referrer creates link to business
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Business (email): "New referrer promoting your business"

### Business Claimed
- **Event:** Business owner claims their listing
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Business (email): "Welcome to TradeRefer - setup guide"
  - ❓ Admin (email): "New business claimed"

---

## 4. CONSUMER NOTIFICATIONS

### Lead Submitted
- **Event:** Consumer submits lead enquiry
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Consumer (email): "Enquiry submitted - what happens next"
  - ❓ Consumer (SMS): AI screening Q1

### Screening Questions
- **Event:** AI screening flow
- **Current Status:** ✅ IMPLEMENTED (just deployed)
- **Notifications:**
  - ✅ Consumer (SMS): Q1, Q2, Q3
  - ✅ Consumer (SMS): Thank you when PASS
  - ✅ Consumer (SMS): Wrong category + customer service offer when FAIL

### Lead Unlocked
- **Event:** Business unlocks consumer's details
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Consumer (email + SMS): "Business has your details and will contact you"

### Business On The Way
- **Event:** Business marks on the way
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Consumer (SMS): "Business on the way - PIN: XXXX"

### Job Completed
- **Event:** Consumer confirms PIN
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Consumer (email): "Thanks for using TradeRefer - leave review"

---

## 5. MESSAGING NOTIFICATIONS

### New Message Received
- **Event:** User receives a message
- **Current Status:** ✅ IMPLEMENTED (just deployed)
- **Notifications:**
  - ✅ Recipient (email): Message preview + link
  - ✅ Recipient (SMS): Message preview + link

### Message Read
- **Event:** Message marked as read
- **Current Status:** ❌ NOT IMPLEMENTED
- **Should notify:**
  - ❓ Sender: "Message read" indicator (in-app only, no email/SMS)

---

## 6. ADMIN NOTIFICATIONS

### Failed Screening
- **Event:** Lead fails AI screening
- **Current Status:** ✅ IMPLEMENTED (just deployed)
- **Notifications:**
  - ✅ Admin (email): QA alert with full details

### Dispute Raised
- **Event:** Lead disputed
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Admin (email): Dispute details for review

### Payout Requested
- **Event:** Referrer requests payout
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Admin (email): Payout approval needed

### New Business Claimed
- **Event:** Business claims listing
- **Current Status:** Checking...
- **Should notify:**
  - ❓ Admin (email): New business to verify

---

## AUDIT STATUS: IN PROGRESS

Next steps:
1. Check each endpoint in routers/leads.py
2. Check each endpoint in routers/referrers.py
3. Check each endpoint in routers/businesses.py
4. Check services/email.py for all email functions
5. Check services/sms.py for all SMS functions
6. Create matrix of what exists vs what's missing
7. Implement missing notifications
