# HerniaCare App

Digital assistant for Post-operative Hernia recovery. Now powered by Node.js and MongoDB.

## Project Structure
- `client/`: React Native (Expo) frontend application.
- `backend/`: Node.js + Express + MongoDB backend server.

## Prerequisites
- Node.js (v18 or newer)
- MongoDB (Atlas or local instance)
- Expo Go app on your mobile device (for physical device testing)

## Setup & Running

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   - Create a `.env` file based on `.env.example`.
   - Update your `MONGO_URI` and `JWT_SECRET`.
4. Start the server:
   ```bash
   node server.js
   ```

### 2. Frontend Setup
1. Navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables:
   - Create a `.env` file based on `.env.example`.
   - Set `API_URL` to `http://YOUR_COMPUTER_IP:3000/api` (Use your local IP).
4. Start the app:
   ```bash
   npx expo start
   ```

## Development Tips
- Ensure both the backend server and your mobile device are on the **same Wi-Fi network**.
- Use `ipconfig` (Windows) to find your IPv4 address for the `API_URL`.
