# 🔄 Autopay Atomic Swap - BTC ↔ PYUSD

A comprehensive CLI tool for atomic swaps between Bitcoin (BTC) and PayPal USD (PYUSD) with integrated AutoPay functionality. This system supports both on-chain and  transaction flows for complete cross-chain asset exchange.

## 🎯 Overview

This project implements a trustless atomic swap protocol that enables users to exchange Bitcoin and PYUSD without requiring a trusted intermediary. The system includes:

- **BTC <-> PYUSD**: Full on-chain implementation with real testnet transactions
- **AutoPay System**: Automated recurring PYUSD payments to merchants
- **HTLC (Hash Time-Locked Contracts)**: Cryptographic primitives ensuring atomicity

## 🏗️ Architecture

### Network Topology

```mermaid
flowchart TB
    subgraph BTC_NET["₿ Bitcoin Testnet3"]
        BTC["🌐 Bitcoin Network"]
        HTLC_BTC["📜 HTLC Script<br/>2MttKc13ks1VNMcQhBnMd6v3FyuWQJeAWFw"]
        BTC_USER["👤 User BTC Address<br/>tb1qpfrsr2k3t928vpuvrz0l4vdl3yyvpgwxleugmp"]
    end
    
    subgraph ETH_NET["⟠ Ethereum Sepolia"]
        ETH["🌐 Ethereum Network"]
        ESCROW["🏦 Escrow Contract<br/>0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B"]
        PYUSD["💰 PYUSD Contract<br/>0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9"]
        AUTOPAY["⏰ AutoPay Contract"]
        EVM_USER["👤 User EVM Address<br/>0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B"]
    end
    
    subgraph CLI_APP["💻 CLI Application"]
        CLI["🖥️ Atomic Swap CLI"]
        RPC_FALLBACK["🔄 RPC Fallback System"]
        HTLC_DETECTOR["🔍 HTLC Detector"]
        ESCROW_MGR["🏦 Escrow Manager"]
        AUTOPAY_MGR["⏰ AutoPay Manager"]
    end
    
    subgraph EXT_SVC["🌐 External Services"]
        ALCHEMY["🔌 Alchemy RPC<br/>Ethereum Sepolia"]
        BLOCKSTREAM["🔌 Blockstream API<br/>Bitcoin Testnet"]
        EXPLORER_ETH["🔍 Etherscan Explorer"]
        EXPLORER_BTC["🔍 Mempool Explorer"]
    end
    
    %% Connections
    CLI --> BTC
    CLI --> ETH
    CLI --> RPC_FALLBACK
    RPC_FALLBACK --> ALCHEMY
    RPC_FALLBACK --> BLOCKSTREAM
    
    BTC --> HTLC_BTC
    BTC --> BTC_USER
    ETH --> ESCROW
    ETH --> PYUSD
    ETH --> AUTOPAY
    ETH --> EVM_USER
    
    ESCROW --> PYUSD
    AUTOPAY --> PYUSD
    
    CLI --> HTLC_DETECTOR
    CLI --> ESCROW_MGR
    CLI --> AUTOPAY_MGR
    
    HTLC_DETECTOR --> BTC
    ESCROW_MGR --> ETH
    AUTOPAY_MGR --> ETH
    
    ALCHEMY --> EXPLORER_ETH
    BLOCKSTREAM --> EXPLORER_BTC
    
    %% Styling
    classDef btcNetwork fill:#f9f9f9,stroke:#f7931a,stroke-width:3px
    classDef ethNetwork fill:#f0f8ff,stroke:#627eea,stroke-width:3px
    classDef cliApp fill:#f0fff0,stroke:#32cd32,stroke-width:3px
    classDef extServices fill:#fff5f5,stroke:#ff6b6b,stroke-width:3px
    
    class BTC,HTLC_BTC,BTC_USER btcNetwork
    class ETH,ESCROW,PYUSD,AUTOPAY,EVM_USER ethNetwork
    class CLI,RPC_FALLBACK,HTLC_DETECTOR,ESCROW_MGR,AUTOPAY_MGR cliApp
    class ALCHEMY,BLOCKSTREAM,EXPLORER_ETH,EXPLORER_BTC extServices
```

### Alternative Text-Based Network Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🌐 NETWORK TOPOLOGY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │  ₿ BITCOIN      │    │  ⟠ ETHEREUM     │    │  💻 CLI APP     │        │
│  │  TESTNET3       │    │  SEPOLIA        │    │  APPLICATION    │        │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤        │
│  │ 🌐 Bitcoin      │    │ 🌐 Ethereum     │    │ 🖥️ Atomic Swap  │        │
│  │ 📜 HTLC Script  │    │ 🏦 Escrow       │    │ 🔄 RPC Fallback │        │
│  │ 👤 User Address │    │ 💰 PYUSD        │    │ 🔍 HTLC Detector│        │
│  │                 │    │ ⏰ AutoPay      │    │ 🏦 Escrow Mgr   │        │
│  │                 │    │ 👤 User Address │    │ ⏰ AutoPay Mgr  │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│           │                       │                       │                │
│           └───────────────────────┼───────────────────────┘                │
│                                   │                                        │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │                    🌐 EXTERNAL SERVICES                         │      │
│  ├─────────────────────────────────────────────────────────────────┤      │
│  │ 🔌 Alchemy RPC    │ 🔌 Blockstream API │ 🔍 Block Explorers   │      │
│  └─────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```mermaid
flowchart TD
    subgraph UI["🖥️ User Interface Layer"]
        CMD["📝 CLI Commands"]
        INTERACTIVE["🔄 Interactive Mode"]
        DEMO["🎯 Demo Mode"]
    end
    
    subgraph SL["⚙️ Service Layer"]
        SWAP_SVC["🔄 Swap Service"]
        AUTOPAY_SVC["💰 AutoPay Service"]
        WALLET_SVC["👛 Wallet Service"]
    end
    
    subgraph BL["⛓️ Blockchain Layer"]
        BTC_NODE["₿ Bitcoin Node"]
        ETH_NODE["⟠ Ethereum Node"]
        CONTRACTS["📜 Smart Contracts"]
    end
    
    subgraph IL["🌐 Infrastructure Layer"]
        RPC["🔌 RPC Providers"]
        EXPLORER["🔍 Block Explorers"]
        MOCK["🎭  Services"]
    end
    
    %% Data Flow
    CMD --> SWAP_SVC
    INTERACTIVE --> SWAP_SVC
    DEMO --> SWAP_SVC
    
    SWAP_SVC --> WALLET_SVC
    SWAP_SVC --> AUTOPAY_SVC
    
    WALLET_SVC --> BTC_NODE
    WALLET_SVC --> ETH_NODE
    AUTOPAY_SVC --> CONTRACTS
    
    BTC_NODE --> RPC
    ETH_NODE --> RPC
    CONTRACTS --> ETH_NODE
    
    RPC --> EXPLORER
    RPC --> MOCK
    
    %% Styling
    classDef uiLayer fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef serviceLayer fill:#f1f8e9,stroke:#388e3c,stroke-width:2px
    classDef blockchainLayer fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef infraLayer fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class CMD,INTERACTIVE,DEMO uiLayer
    class SWAP_SVC,AUTOPAY_SVC,WALLET_SVC serviceLayer
    class BTC_NODE,ETH_NODE,CONTRACTS blockchainLayer
    class RPC,EXPLORER,MOCK infraLayer
```

### Alternative Text-Based Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    🖥️ USER INTERFACE LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│  📝 CLI Commands  │  🔄 Interactive Mode  │  🎯 Demo Mode      │
└─────────────────┬─────────────────┬─────────────────┬───────────┘
                  │                 │                 │
                  ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ⚙️ SERVICE LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  🔄 Swap Service  │  💰 AutoPay Service  │  👛 Wallet Service  │
└─────────────────┬─────────────────┬─────────────────┬───────────┘
                  │                 │                 │
                  ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ⛓️ BLOCKCHAIN LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  ₿ Bitcoin Node  │  ⟠ Ethereum Node  │  📜 Smart Contracts    │
└─────────────────┬─────────────────┬─────────────────┬───────────┘
                  │                 │                 │
                  ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  🌐 INFRASTRUCTURE LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  🔌 RPC Providers  │  🔍 Block Explorers  │  🎭  Services  │
└─────────────────────────────────────────────────────────────────┘
```

### Network Configuration
- **Bitcoin**: Testnet3 (Bitcoin testnet)
- **Ethereum**: Sepolia testnet
- **PYUSD Contract**: `0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9`

### Key Components
- **HTLC Contracts**: Bitcoin script-based and Ethereum smart contracts
- **Escrow System**: Custom PYUSD escrow for secure fund management
- **AutoPay Contracts**: Automated recurring payment system
- **RPC Fallback**: Automatic fallback from real to  mode

## 🔄 BTC → PYUSD Atomic Swap Flow

### Transaction Flow Network Diagram

```mermaid
graph TD
    subgraph "Phase 1: HTLC Creation"
        A[User Initiates Swap] --> B[Create BTC HTLC Script]
        B --> C[Generate HTLC Address<br/>2MttKc13ks1VNMcQhBnMd6v3FyuWQJeAWFw]
        C --> D[Fund HTLC with BTC]
        D --> E[Monitor HTLC Funding]
    end
    
    subgraph "Phase 2: Escrow Deployment"
        E --> F[Deploy Escrow Contract]
        F --> G[Escrow Address<br/>0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B]
        G --> H[Transfer PYUSD to Escrow]
        H --> I[Escrow Holds PYUSD]
    end
    
    subgraph "Phase 3: Secret Revelation"
        I --> J[HTLC Funding Detected]
        J --> K[Reveal Secret to Escrow]
        K --> L[Escrow Releases PYUSD]
        L --> M[User Receives PYUSD]
    end
    
    subgraph "Phase 4: BTC Claiming"
        M --> N[Resolver Claims BTC]
        N --> O[BTC Sent to Recipient<br/>tb1qpfrsr2k3t928vpuvrz0l4vdl3yyvpgwxleugmp]
    end
    
    subgraph "Phase 5: AutoPay (Optional)"
        O --> P[Deploy AutoPay Contract]
        P --> Q[Fund AutoPay with PYUSD]
        Q --> R[Start Recurring Payments]
        R --> S[Payments to Merchant]
    end
    
    %% Styling
    classDef phase1 fill:#e1f5fe
    classDef phase2 fill:#f3e5f5
    classDef phase3 fill:#e8f5e8
    classDef phase4 fill:#fff3e0
    classDef phase5 fill:#fce4ec
    
    class A,B,C,D,E phase1
    class F,G,H,I phase2
    class J,K,L,M phase3
    class N,O phase4
    class P,Q,R,S phase5
```

### Sequence Diagram

```mermaid
sequenceDiagram
    participant M as Maker (BTC Holder)
    participant BA as Bitcoin Network
    participant EA as Ethereum Network
    participant E as Escrow Contract
    participant R as Resolver/Taker
    participant P as PYUSD Contract

    Note over M,R: Phase 1: Order Creation & HTLC Setup
    M->>BA: Create BTC HTLC Script
    M->>BA: Fund HTLC Address
    BA-->>M: HTLC Address & Script Hash
    
    Note over M,R: Phase 2: Escrow Deployment & Funding
    M->>EA: Deploy Escrow Contract
    EA-->>M: Escrow Contract Address
    M->>P: Transfer PYUSD to Escrow
    P->>E: PYUSD Deposited
    
    Note over M,R: Phase 3: HTLC Detection & Validation
    M->>BA: Monitor HTLC Funding
    BA-->>M: HTLC Confirmed
    M->>E: Trigger PYUSD Release
    
    Note over M,R: Phase 4: Secret Revelation & Claiming
    M->>E: Reveal Secret
    E->>M: Transfer PYUSD to Maker
    R->>BA: Claim BTC with Secret
    BA->>R: BTC Transferred to Recipient
    
    Note over M,R: Phase 5: AutoPay Setup (Optional)
    M->>EA: Deploy AutoPay Contract
    M->>E: Fund AutoPay with PYUSD
    E->>EA: Start Recurring Payments
```

### Transaction Flow Details

#### Phase 1: HTLC Creation
```bash
# Create Bitcoin HTLC with recipient address
HTLC Script: OP_IF
  OP_SHA256 <hashLock> OP_EQUALVERIFY
  <recipientPubKey> OP_CHECKSIG
OP_ELSE
  <timelock> OP_CHECKSEQUENCEVERIFY OP_DROP
  <makerPubKey> OP_CHECKSIG
OP_ENDIF
```

#### Phase 2: Escrow Deployment
```solidity
// Escrow Contract (Simplified)
contract Escrow {
    function releasePYUSD(bytes32 secret) external {
        require(keccak256(abi.encodePacked(secret)) == hashLock, "Invalid secret");
        pyusdToken.transfer(maker, amount);
    }
}
```

#### Phase 3: Real Transaction Hashes
- **Bitcoin HTLC**: `2MttKc13ks1VNMcQhBnMd6v3FyuWQJeAWFw`
- **Ethereum Escrow**: `0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B`
- **PYUSD Transfer**: Real Sepolia testnet transaction

## 🔄 PYUSD → BTC Atomic Swap Flow 

### Sequence Diagram

```mermaid
sequenceDiagram
    participant M as Maker (PYUSD Holder)
    participant EA as Ethereum Network
    participant E as Escrow Contract
    participant BA as Bitcoin Network ()
    participant R as Resolver/Taker

    Note over M,R: Phase 1: PYUSD Escrow Funding
    M->>E: Fund PYUSD Escrow
    E-->>M: Escrow Funded Confirmation
    
    Note over M,R: Phase 2: BTC HTLC Creation ()
    M->>BA: Create BTC HTLC Script
    BA-->>M: HTLC Address & Script Hash
    M->>BA: Fund HTLC (Simulated)
    BA-->>M: HTLC Funded Confirmation
    
    Note over M,R: Phase 3: Network Confirmations (Simulated)
    EA->>E: PYUSD Transaction Confirmed
    BA->>BA: BTC Transaction Confirmed
    
    Note over M,R: Phase 4: Secret Revelation & Claiming (Simulated)
    M->>E: Reveal Secret
    E->>M: Transfer PYUSD to Maker
    R->>BA: Claim BTC with Secret (Simulated)
    BA->>R: BTC Transferred to Recipient Address
```

## 💰 AutoPay System

### AutoPay Network Architecture

```mermaid
graph TB
    subgraph "User Layer"
        USER[User/Maker]
        MERCHANT[Merchant]
        CLI_CMD[CLI Commands]
    end
    
    subgraph "Contract Layer"
        AUTOPAY_CONTRACT[AutoPay Contract<br/>Deployed on Sepolia]
        PYUSD_CONTRACT[PYUSD Token Contract<br/>0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9]
        ESCROW_CONTRACT[Escrow Contract<br/>0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B]
    end
    
    subgraph "Management Layer"
        AUTOPAY_MGR[AutoPay Manager]
        DEPLOY_SCRIPT[Deploy Script]
        FUND_SCRIPT[Fund Script]
        EXECUTE_SCRIPT[Auto-Execute Script]
    end
    
    subgraph "Ethereum Sepolia Network"
        ETH_NETWORK[Ethereum Network]
        BLOCK_EXPLORER[Etherscan Explorer]
        RPC_NODE[Alchemy RPC Node]
    end
    
    %% User Interactions
    USER --> CLI_CMD
    CLI_CMD --> AUTOPAY_MGR
    
    %% Contract Deployments
    AUTOPAY_MGR --> DEPLOY_SCRIPT
    DEPLOY_SCRIPT --> AUTOPAY_CONTRACT
    AUTOPAY_CONTRACT --> ETH_NETWORK
    
    %% Funding Process
    USER --> FUND_SCRIPT
    FUND_SCRIPT --> PYUSD_CONTRACT
    PYUSD_CONTRACT --> AUTOPAY_CONTRACT
    
    %% Payment Execution
    EXECUTE_SCRIPT --> AUTOPAY_CONTRACT
    AUTOPAY_CONTRACT --> PYUSD_CONTRACT
    PYUSD_CONTRACT --> MERCHANT
    
    %% Network Connections
    ETH_NETWORK --> RPC_NODE
    ETH_NETWORK --> BLOCK_EXPLORER
    
    %% Contract Relationships
    AUTOPAY_CONTRACT -.-> PYUSD_CONTRACT
    ESCROW_CONTRACT -.-> PYUSD_CONTRACT
    
    %% Styling
    classDef userLayer fill:#e3f2fd
    classDef contractLayer fill:#f1f8e9
    classDef managementLayer fill:#fff3e0
    classDef networkLayer fill:#fce4ec
    
    class USER,MERCHANT,CLI_CMD userLayer
    class AUTOPAY_CONTRACT,PYUSD_CONTRACT,ESCROW_CONTRACT contractLayer
    class AUTOPAY_MGR,DEPLOY_SCRIPT,FUND_SCRIPT,EXECUTE_SCRIPT managementLayer
    class ETH_NETWORK,BLOCK_EXPLORER,RPC_NODE networkLayer
```

### AutoPay Flow Network Diagram

```mermaid
graph TD
    subgraph "Initialization Phase"
        A[User Configures AutoPay] --> B[Set Payment Parameters]
        B --> C[Deploy AutoPay Contract]
        C --> D[Fund Contract with PYUSD]
    end
    
    subgraph "Activation Phase"
        D --> E[Start AutoPay Service]
        E --> F[Contract Becomes Active]
        F --> G[Monitor Payment Intervals]
    end
    
    subgraph "Execution Phase"
        G --> H{Payment Time?}
        H -->|Yes| I[Execute Payment]
        H -->|No| G
        I --> J[Transfer PYUSD to Merchant]
        J --> K[Update Contract State]
        K --> L{More Payments?}
        L -->|Yes| G
        L -->|No| M[AutoPay Complete]
    end
    
    subgraph "Management Phase"
        M --> N[User Can Withdraw Remaining]
        N --> O[Contract Deactivated]
        
        G --> P[User Can Pause/Resume]
        P --> Q[Update Contract State]
        Q --> G
    end
    
    %% Styling
    classDef initPhase fill:#e8f5e8
    classDef activePhase fill:#e1f5fe
    classDef execPhase fill:#fff3e0
    classDef mgmtPhase fill:#f3e5f5
    
    class A,B,C,D initPhase
    class E,F,G activePhase
    class H,I,J,K,L,M execPhase
    class N,O,P,Q mgmtPhase
```

### Architecture Overview

The AutoPay system enables automated recurring PYUSD payments to merchants with configurable parameters:

```solidity
contract AutoPay {
    address public owner;
    address public merchant;
    IERC20 public pyusdToken;
    
    uint256 public paymentAmount;      // Amount per payment
    uint256 public paymentInterval;    // Time between payments
    uint256 public totalDuration;      // Total contract duration
    uint256 public remainingBalance;   // Available funds
    
    bool public isActive;
    bool public isPaused;
}
```

### AutoPay Flow Diagram

```mermaid
sequenceDiagram
    participant M as Maker
    participant AC as AutoPay Contract
    participant P as PYUSD Contract
    participant ME as Merchant

    Note over M,ME: Phase 1: Contract Deployment
    M->>AC: Deploy AutoPay Contract
    M->>P: Transfer PYUSD to Contract
    P->>AC: Fund Contract
    
    Note over M,ME: Phase 2: AutoPay Activation
    M->>AC: Start AutoPay
    AC-->>M: AutoPay Active
    
    Note over M,ME: Phase 3: Recurring Payments
    loop Every Payment Interval
        AC->>P: Transfer PYUSD to Merchant
        P->>ME: PYUSD Received
        AC-->>M: Payment Executed
    end
    
    Note over M,ME: Phase 4: Contract Management
    M->>AC: Pause/Resume/Stop AutoPay
    AC-->>M: Status Updated
```

### AutoPay Features

#### Dynamic Configuration
- **Payment Amount**: Configurable PYUSD amount per interval
- **Payment Interval**: Time between payments (minutes/hours)
- **Total Duration**: How long the AutoPay runs
- **Merchant Address**: EVM address to receive payments

#### Management Functions
```typescript
// Start AutoPay
await autopayManager.startAutoPay();

// Execute single payment
await autopayManager.executePayment();

// Pause/Resume
await autopayManager.pauseAutoPay();
await autopayManager.resumeAutoPay();

// Stop and withdraw
await autopayManager.stopAutoPay();
await autopayManager.withdrawRemainingFunds();
```

## 🚀 Quick Start

### Installation
```bash
git clone <repository-url>
cd atomic-swap-cli
npm install
npm run build
```

### BTC → PYUSD Swap (On-Chain)
```bash
# Complete demo with real transactions
npm run demo-escrow-complete

# Manual execution
npx ts-node src/index.ts btc-to-pyusd --btc-key <key> --evm-key <key> --amount 100000
```

### PYUSD → BTC Swap ()
```bash
# With BTC address only
npx ts-node src/index.ts pyusd-to-btc --btc-address <address> --amount 1.0

# Interactive mode
npx ts-node src/index.ts pyusd-to-btc --amount 1.0
```

### AutoPay Management
```bash
# Deploy AutoPay contract
npx ts-node src/cli/index.ts deploy-autopay

# Manage existing contract
npx ts-node src/cli/index.ts manage-autopay <address> <action>

# Auto-execute payments
npm run auto-execute <contract-address>
```

## 📋 CLI Commands Reference

### Atomic Swap Commands
```bash
# BTC → PYUSD (On-chain)
npx ts-node src/index.ts btc-to-pyusd [options]

# PYUSD → BTC ()
npx ts-node src/index.ts pyusd-to-btc [options]

# EVM → BTC
npx ts-node src/index.ts evm-to-btc [options]

# BTC → EVM
npx ts-node src/index.ts btc-to-evm [options]

# Interactive mode
npx ts-node src/index.ts interactive
```

### AutoPay Commands
```bash
# Deploy AutoPay
npx ts-node src/cli/index.ts deploy-autopay [options]

# Manage AutoPay
npx ts-node src/cli/index.ts manage-autopay <address> <action>

# Available actions: start, pause, resume, stop, execute, withdraw, info, update
```

### Utility Commands
```bash
# Check balances
npm run check-balances

# Deploy escrow
npm run deploy-escrow

# Fund AutoPay
npm run fund-autopay <address> <amount>
```

## 🔧 Configuration

### Environment Variables
```bash
# Ethereum RPC
EVM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Bitcoin RPC
BTC_RPC_URL=https://blockstream.info/testnet/api

# PYUSD Contract
PYUSD_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
```

## 🛡️ Security Features

### HTLC Security
- **Time Locks**: Prevents indefinite fund locking
- **Hash Locks**: Ensures atomicity through secret revelation
- **Script Validation**: Bitcoin script-based security
- **Smart Contract Audits**: Solidity contract security

### AutoPay Security
- **Owner Controls**: Only contract owner can manage
- **Balance Validation**: Prevents over-spending
- **Pause/Resume**: Emergency controls
- **Withdrawal Safety**: Secure fund recovery

## 📊 Transaction Examples

### Real BTC → PYUSD Transaction
```
Bitcoin HTLC Address: 2MttKc13ks1VNMcQhBnMd6v3FyuWQJeAWFw
Ethereum Escrow: 0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B
PYUSD Amount: 1.0 PYUSD (1,000,000 units)
Bitcoin Amount: 0.0001 BTC (10,000 sats)
```

###  PYUSD → BTC Transaction
```
PYUSD Escrow: 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
Bitcoin HTLC: 2MttKc13ks1VNMcQhBnMd6v3FyuWQJeAWFw
Recipient Address: tb1qpfrsr2k3t928vpuvrz0l4vdl3yyvpgwxleugmp
```

## 🔍 Monitoring & Debugging

### Transaction Tracking
- **Ethereum Explorer**: https://sepolia.etherscan.io/
- **Bitcoin Explorer**: https://mempool.space/testnet/
- **Real-time Logs**: Detailed transaction flow logging

### Error Handling
- **RPC Fallback**: Automatic fallback to  mode
- **Validation Checks**: Comprehensive input validation
- **Recovery Mechanisms**: Fund recovery options

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review transaction logs for debugging

---

**⚠️ Disclaimer**: This is a testnet implementation for educational purposes. Do not use with mainnet funds without proper security audits.