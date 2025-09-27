# 🚀 Atomic Swap Frontend - BTC to PYUSD with AutoPay

A complete React-based frontend for Bitcoin to PYUSD atomic swaps with automated recurring payment functionality.

## ✨ Features

- **🔗 Wallet Connection**: MetaMask integration for EVM wallet connection
- **⚡ Atomic Swaps**: Complete BTC → PYUSD atomic swap interface
- **🤖 AutoPay System**: Automated recurring PYUSD payments to merchants
- **📱 Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **🔄 Real-time Updates**: Live status updates and transaction tracking
- **🎯 User-Friendly**: Step-by-step wizard with clear instructions

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Ethers.js** for Ethereum interactions
- **QR Code** generation for BTC addresses
- **React Hot Toast** for notifications

### Backend Stack
- **Express.js** with TypeScript
- **WebSocket** for real-time updates
- **Integration** with existing CLI functionality
- **REST API** for swap and AutoPay management

## 🚀 Quick Start

### 1. Start the Backend
```bash
./start-backend.sh
```
The backend will run on `http://localhost:3001`

### 2. Start the Frontend
```bash
./start-frontend.sh
```
The frontend will run on `http://localhost:3000`

### 3. Open in Browser
Navigate to `http://localhost:3000` to access the application.

## 📱 User Journey

### Phase 1: Atomic Swap
1. **Connect MetaMask** - User connects their Ethereum wallet
2. **Enter BTC Address** - User provides their Bitcoin testnet address
3. **Start Swap** - System creates HTLC and displays Bitcoin address
4. **Fund HTLC** - User sends BTC to HTLC address via Electrum
5. **Auto Processing** - System detects funding and processes swap
6. **Receive PYUSD** - User receives PYUSD tokens in their wallet

### Phase 2: AutoPay Setup (Optional)
1. **Setup AutoPay** - User clicks "Setup AutoPay" after swap completion
2. **Configure Payments** - User enters merchant address and payment details
3. **Deploy Contract** - System deploys AutoPay contract with user's configuration
4. **Start Payments** - AutoPay begins sending recurring payments

### Phase 3: AutoPay Management
1. **Dashboard** - Real-time view of payment status and history
2. **Control** - Start, pause, resume, or stop AutoPay
3. **Monitoring** - Track payments and remaining balance

## 🎨 UI Components

### WalletConnection
- MetaMask wallet connection
- Bitcoin address input with validation
- Address display with copy functionality
- Balance and network information

### AtomicSwap
- Swap status with visual indicators
- HTLC address display with QR code
- Step-by-step instructions
- Transaction links and explorer integration

### AutoPayModal
- Merchant address configuration
- Payment amount and interval settings
- Cost calculation and preview
- Form validation and error handling

### AutoPayDashboard
- Real-time payment status
- Payment history and statistics
- Contract information and controls
- Next payment countdown

## 🔧 Configuration

### Environment Variables
Create `.env` files in both frontend and backend directories:

**Frontend (.env)**
```
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_CHAIN_ID=11155111
REACT_APP_PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
```

**Backend (.env)**
```
PORT=3001
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
ESCROW_ADDRESS=0x... # Your deployed Escrow address
```

### Contract Addresses
- **Escrow Contract**: Deployed automatically during swaps
- **PYUSD Token**: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9` (Sepolia testnet)
- **AutoPay Contracts**: Deployed dynamically per user configuration

## 🔐 Security Features

- **Input Validation**: All addresses and amounts validated
- **Transaction Confirmation**: User must approve all transactions
- **Balance Checks**: Ensures sufficient funds before operations
- **Error Recovery**: Graceful handling of failed transactions
- **Audit Trail**: Complete transaction history

## 📊 API Endpoints

### Swap Endpoints
- `POST /api/swap/start` - Start new atomic swap
- `GET /api/swap/check-funding/:htlcAddress` - Check HTLC funding
- `POST /api/swap/execute/:swapId` - Execute swap after funding
- `GET /api/swap/status/:swapId` - Get swap status

### AutoPay Endpoints
- `POST /api/autopay/setup` - Setup new AutoPay
- `POST /api/autopay/stop` - Stop AutoPay
- `GET /api/autopay/info/:contractAddress` - Get AutoPay info
- `GET /api/autopay/all` - Get all AutoPays

## 🎯 Key Features

### Real-time Updates
- WebSocket connection for live status updates
- Automatic refresh of payment status
- Real-time balance updates

### Mobile Responsive
- Optimized for mobile devices
- Touch-friendly interface
- Responsive grid layouts

### Error Handling
- User-friendly error messages
- Transaction failure recovery
- Network error handling

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### Docker Support
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask browser extension
- Electrum wallet (for BTC testing)

### Development Commands
```bash
# Frontend development
cd frontend
npm start          # Start dev server
npm run build      # Build for production
npm test           # Run tests

# Backend development
cd backend
npm run dev        # Start dev server
npm run build      # Build TypeScript
npm start          # Start production server
```

## 📝 Notes

- **Testnet Only**: Currently configured for Sepolia testnet and Bitcoin testnet3
- **Real Transactions**: Uses actual blockchain transactions (testnet)
- **Escrow Integration**: Integrates with existing Escrow contract system
- **CLI Compatibility**: Works alongside existing CLI functionality

## 🎉 Success!

The frontend provides a complete, user-friendly interface for the entire BTC → PYUSD → AutoPay flow while maintaining the security and functionality of the CLI system.

**Ready for production use!** 🚀
