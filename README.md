# MiniLedger 🤝 — Friend Loan Tracker

MiniLedger is a full-stack mobile application that helps users track money lent to friends, monitor repayments, and identify overdue loans with automated financial calculations.

Built for the **Full Stack Development Internship Assessment**.

---

## 🛠️ Tech Stack

- **Mobile App:** React Native with Expo (JavaScript)
- **Backend API:** Node.js & Express (JavaScript)
- **Database:** PostgreSQL (with parameterized queries and decimal precision)
- **Authentication:** Phone Number + 6-digit OTP with JWT session tokens
- **Testing:** Jest & Supertest automated test suite

---

## 📁 Repository Structure

```
MiniLeader_App/
├── backend/
│   ├── config/
│   │   ├── db.js              # PostgreSQL connection pool
│   │   └── schema.sql         # Database schema (users, otps, loans)
│   ├── controllers/
│   │   ├── authController.js  # Send OTP, Verify OTP, GetMe
│   │   └── loanController.js  # Loan CRUD, Repay, Summary calculations
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT Bearer token verification
│   ├── routes/
│   │   ├── authRoutes.js      # /api/auth routes with rate limiting
│   │   └── loanRoutes.js      # /api/loans protected routes
│   ├── tests/
│   │   └── api.test.js        # Automated Jest test suite
│   ├── .env.example           # Example environment variables
│   ├── package.json
│   └── server.js              # Server entry point & health check
│
├── mobile/
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js         # Axios instance with JWT interceptor
│   │   ├── context/
│   │   │   └── AuthContext.js # Session & auth state management
│   │   └── screens/
│   │       ├── LoginScreen.js     # Phone number input & request OTP
│   │       ├── OtpScreen.js       # 6-digit OTP verification
│   │       ├── DashboardScreen.js # Financial overview (4 calculation cards)
│   │       ├── AddLoanScreen.js   # Record new friend loan with due date
│   │       └── LoanListScreen.js  # Filterable registry (All/Unpaid/Repaid/Overdue)
│   ├── App.js                 # Root navigator with Auth/App stack split
│   ├── app.json               # Expo project configuration
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **PostgreSQL** (v14 or higher)
- **Expo Go app** on mobile or Android Studio / Xcode emulator

---

### 2. Database Setup

1. Open your PostgreSQL terminal (`psql`) or pgAdmin.
2. Create the database:
   ```sql
   CREATE DATABASE miniledger_db;
   ```
3. Run the schema file to initialize the tables (`users`, `otps`, `loans`):
   ```bash
   psql -U postgres -d miniledger_db -f backend/config/schema.sql
   ```

---

### 3. Backend Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your PostgreSQL credentials:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=miniledger_db
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   ```
5. Start the backend server:
   ```bash
   npm start
   # Or for hot reload during development:
   npm run dev
   ```
   Server will run on `http://localhost:3000`.

6. Run automated test suite:
   ```bash
   npm test
   ```

---

### 4. Mobile App Setup

1. Navigate to the `mobile` folder:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Network Configuration:
   - **Android Emulator:** Uses `http://10.0.2.2:3000` (pre-configured in `src/api/api.js`).
   - **Physical Device:** Update `DEV_MACHINE_IP` in `mobile/src/api/api.js` with your computer's local Wi-Fi IP (e.g. `192.168.1.X`).
4. Start the Expo development server:
   ```bash
   npx expo start
   ```
5. Press `a` for Android emulator, `i` for iOS simulator, or scan the QR code using the **Expo Go** app on your physical device.

---

## 🔌 API Endpoints Documentation

### Health Check
- `GET /api/health`
  - **Description:** Returns API operational status.
  - **Response (200):**
    ```json
    {
      "status": "OK",
      "service": "MiniLedger Backend API",
      "timestamp": "2026-10-23T09:50:00.000Z"
    }
    ```

---

### Authentication (Phone + OTP)

#### 1. Send OTP
- `POST /api/auth/send-otp`
- **Rate Limit:** 10 requests per 10 minutes.
- **Request Body:**
  ```json
  {
    "phone": "9876543210"
  }
  ```
- **Terminal Output:** The backend server generates a 6-digit code and outputs:
  ```
  =========================================
  🔑 [MiniLedger OTP] Phone: 9876543210 | OTP: 859509
  ⏰ Valid for 5 minutes
  =========================================
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "OTP sent successfully. Check the server console.",
    "phone": "9876543210"
  }
  ```

#### 2. Verify OTP
- `POST /api/auth/verify-otp`
- **Request Body:**
  ```json
  {
    "phone": "9876543210",
    "otp": "859509"
  }
  ```
- **Validation:** Rejects wrong OTPs, expired OTPs (>5 mins), and already used OTPs.
- **Response (200):**
  ```json
  {
    "success": true,
    "message": "Authentication successful!",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": 1,
      "phone": "9876543210",
      "name": "User 3210"
    }
  }
  ```

---

### Loan Management (Protected with Bearer Token)

*Header required on all loan endpoints:*
`Authorization: Bearer <JWT_TOKEN>`

#### 3. Create Loan
- `POST /api/loans`
- **Request Body:**
  ```json
  {
    "friend_name": "Rohan Gupta",
    "amount": 5000,
    "due_date": "2026-11-15",
    "notes": "Emergency repair split"
  }
  ```
- **Response (201):**
  ```json
  {
    "message": "Loan added successfully!",
    "loan": {
      "id": 1,
      "user_id": 1,
      "friend_name": "Rohan Gupta",
      "amount": "5000.00",
      "due_date": "2026-11-15",
      "is_repaid": false,
      "repaid_at": null,
      "notes": "Emergency repair split",
      "created_at": "2026-10-23T15:00:00.000Z"
    }
  }
  ```

#### 4. List Loans
- `GET /api/loans?status=all|unpaid|repaid|overdue&search=Rohan`
- **Response (200):**
  ```json
  {
    "loans": [
      {
        "id": 1,
        "friend_name": "Rohan Gupta",
        "amount": "5000.00",
        "due_date": "2026-11-15",
        "is_repaid": false,
        "is_overdue": false
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 50, "total_pages": 1 }
  }
  ```

#### 5. Mark Loan as Repaid
- `PATCH /api/loans/:id/repay`
- **Description:** Updates `is_repaid = true` and records current timestamp in `repaid_at`.
- **Validation:** Returns 404 if loan doesn't exist, and 400 if already repaid.
- **Response (200):**
  ```json
  {
    "message": "Loan successfully marked as repaid!",
    "loan": {
      "id": 1,
      "is_repaid": true,
      "repaid_at": "2026-10-23T15:20:00.000Z"
    }
  }
  ```

#### 6. Dashboard Financial Summary
- `GET /api/loans/summary`
- **Formulae Applied:**
  - **Total Lent:** $\sum$ All loans
  - **Total Repaid:** $\sum$ Repaid loans
  - **Outstanding:** $\sum$ Unpaid loans
  - **Overdue:** $\sum$ Unpaid loans where `due_date < CURRENT_DATE`
- **Response (200):**
  ```json
  {
    "summary": {
      "total_lent": 12000,
      "total_repaid": 5000,
      "outstanding": 7000,
      "overdue": 3000,
      "total_count": 4,
      "repaid_count": 1,
      "unpaid_count": 3,
      "overdue_count": 1
    }
  }
  ```

---

## 📹 2–3 Minute Screen Recording Plan

When recording your demonstration video for submission:

1. **Introduction (0:00 - 0:20)**
   - Introduce yourself and mention the project: MiniLedger Friend Loan Management App.
   - Show the running backend terminal and the mobile app on the login screen.

2. **Authentication Flow (0:20 - 0:50)**
   - Enter your phone number (e.g., `9876543210`) on the Login screen and tap "Send OTP".
   - Switch to the backend terminal window to show the generated 6-digit OTP printed in the console.
   - Enter the OTP on the verification screen and tap "Verify & Continue".
   - Show successful login transition to the Dashboard.

3. **Dashboard & Metrics (0:50 - 1:15)**
   - Explain the 4 summary cards: **Total Lent**, **Total Repaid**, **Outstanding**, and **Overdue**.
   - Note how figures update in real-time.

4. **Adding a Loan (1:15 - 1:45)**
   - Tap "+ Add New Loan to a Friend".
   - Enter friend name (e.g. "Priya"), amount (e.g. ₹3,500), and use the quick date picker "+1 Week".
   - Add a note: "Weekend getaway tickets".
   - Save the loan and demonstrate that the dashboard immediately reflects the new total lent and outstanding figures.

5. **Loan Management, Overdue Highlight & Repayment (1:45 - 2:30)**
   - Open the "Friend Loans Registry" screen.
   - Demonstrate the search bar (filter by friend name).
   - Show status filters (**All**, **Unpaid**, **Repaid**, and **Overdue ⚠️** with red alert styling).
   - Tap **"Mark Repaid ✓"** on an unpaid loan. Confirm the action.
   - Show that the loan gets crossed out / marked with green Repaid badge, and the Total Repaid and Outstanding dashboard balances adjust accordingly.

6. **Conclusion (2:30 - 2:45)**
   - Briefly summarize that user isolation, input validation, and PostgreSQL persistence are all in place.
