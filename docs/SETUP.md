# Project Setup Guide

Welcome to **Turbo BabyMart**! This guide will help you set up the entire project on your local machine.

## 1. Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher (LTS recommended).
- **Package Manager**: This project defaults to `npm`, but you can use `pnpm`, `yarn`, or `bun`.
  - **npm** (Recommended/Default): Comes with Node.js.
  - **pnpm**: `npm install -g pnpm`
  - **yarn**: `npm install -g yarn`
  - **bun**: `npm install -g bun`

- **Git**: For version control.
- **MongoDB**: You can run a local instance or use [MongoDB Atlas](https://www.mongodb.com/atlas).
- **Mobile Development (Optional)**:
    - **Android Studio** (for Android).
    - **Xcode** (for iOS, macOS only).
    - **CocoaPods** (for iOS dependencies).

## 2. Installation

1. **Extract the Project**:
   - Unzip the downloaded file `turbo-babymart.zip`.
   - Open your terminal and navigate to the extracted folder:
   ```bash
   cd turbo-babymart
   ```

2. **Install dependencies**:
   Run one of the following commands:
   
   **npm** (Recommended):
   ```bash
   npm install
   ```
   
   **pnpm**:
   ```bash
   pnpm install
   ```
   
   **yarn**:
   ```bash
   yarn install
   ```
   
   **bun**:
   ```bash
   bun install
   ```

   > **Note**: This guide will use `npm` for all subsequent commands, but you can substitute it with your preferred package manager (e.g., `pnpm dev`, `yarn dev`, `bun dev`).

## 3. Environment Configuration

You must set up environment variables for each application. We have provided example files for you.

### Step 3.1: Copy Example Files
Run the following commands or manually copy the files:

```bash
# Web Storefront
cp apps/web/.env.example apps/web/.env

# Admin Dashboard
cp apps/admin/.env.example apps/admin/.env

# Backend API
cp apps/api/.env.example apps/api/.env
```

### Step 3.2: Configure Secrets
Open each `.env` file and fill in your credentials. See the **Service Credentials Guide** below for details on where to get these keys.

## 4. Running the Project

You can run all applications simultaneously or individually.

### Run All (Recommended)
This command will start the Web Storefront, Admin Dashboard, and API server in parallel.
```bash
npm run dev
```
- **Web Storefront**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:8000](http://localhost:8000)

### Run Individually
If you prefer running them in separate terminals:

**Web Storefront**:
```bash
npm run dev:web
```

**Admin Dashboard**:
```bash
npm run dev:admin
```

**API Server**:
```bash
npm run dev:api
```

## 5. Mobile App Setup (React Native)

To run the mobile app:

1. **Navigate to the mobile directory**:
   ```bash
   cd apps/mobile
   ```

2. **Install iOS Pods (macOS only)**:
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Start Metro Bundler**:
   ```bash
   npm start
   ```

4. **Run on Device/Simulator**:
   - **Android**: `npm run android`
   - **iOS**: `npm run ios`

## 6. Service Credentials Guide

Here is where to find the required keys for your `.env` files.

### MongoDB
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Go to "Connect" -> "Connect your application".
3. Copy the connection string (URI).
4. Replace `<password>` with your database user password.

### Razorpay (Payments)
1. Sign up at [Razorpay](https://razorpay.com) and create a project.
2. In the Razorpay dashboard, go to **Settings -> API Keys** and generate a Key.
3. Copy the **Key ID** and **Key Secret** and place them in `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
4. (Optional, recommended) Create a **Webhook Secret** in **Settings -> Webhooks** and set it as `RAZORPAY_WEBHOOK_SECRET`.
5. Set `PAYMENT_CURRENCY` (defaults to `INR` if omitted).

### Cloudinary (Image Uploads)
1. Sign up at [Cloudinary](https://cloudinary.com).
2. Go to the **Dashboard**.
3. Copy the **Cloud Name**, **API Key**, and **API Secret**.

### Firebase (Authentication)
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Google, Email/Password providers).
3. Go to **Project Settings**.
4. Scroll down to "Your apps" and create a web app.
5. Copy the config values (apiKey, authDomain, projectId, etc.).

### Gmail SMTP (via Gmail API OAuth2)
To send emails reliably without "Less Secure Apps" issues, we use Gmail API with OAuth2.

**1. Create Google Cloud Project & Enable API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project.
   - Go to **APIs & Services** -> **Library**.
   - Search for **"Gmail API"** and click **Enable**.

**2. Create Credentials:**
   - Go to **APIs & Services** -> **OAuth consent screen**.
     - Select **External** (or Internal if you have a G-Suite org).
     - Fill in app name (e.g., "BabyMart Mailer") and support email.
     - Add developer contact info and Save.
     - (Optional) Add your email as a "Test User" if the app is in Testing mode.
   - Go to **Credentials** -> **Create Credentials** -> **OAuth client ID**.
     - Application type: **Web application**.
     - Name: "BabyMart API".
     - Authorized redirect URIs: `https://developers.google.com/oauthplayground` (Temporarily needed to get the refresh token).
     - Click **Create**.
   - **Copy your Client ID and Client Secret**.

**3. Get Refresh Token:**
   - Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
   - Click the **Gear Icon** (Settings) in the top right.
     - Check **"Use your own OAuth credentials"**.
     - Paste your **Client ID** and **Client Secret**.
     - Click Close.
   - In "Step 1: Select & authorize APIs":
     - Find **"Gmail API v1"** and select `https://mail.google.com/`.
     - Click **Authorize API**.
     - Sign in with your Gmail account and allow access.
   - In "Step 2: Exchange authorization code for tokens":
     - Click **"Exchange authorization code for tokens"**.
   - **Copy the Refresh Token**.

**4. Configure Environment:**
   - Open `apps/api/.env`.
   - Update the variables (See `.env.example`):
     - `SMTP_HOST=smtp.gmail.com`
     - `SMTP_PORT=465` (Secure)
     - `MAIL_CLIENT_ID` = *Your Client ID*
     - `MAIL_CLIENT_SECRET` = *Your Client Secret*
     - `MAIL_REFRESH_TOKEN` = *Your Refresh Token*
     - `SENDER_EMAIL_ADDRESS` = *Your Gmail Address*

### Cash on Delivery
- No external credentials are required. Enable/disable COD in your business logic as needed.
