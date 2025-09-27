# Atomic Swap CLI Implementation Notes

## Overview

This CLI implementation is based on the GattaiSwap project but simplified for direct wallet usage without chain abstraction. It provides atomic swaps between EVM Sepolia and BTC Testnet4.

## Key Differences from Original GattaiSwap

### 1. **No Chain Abstraction**
- **Original**: Uses NEAR chain signatures and Shade Agent Framework
- **CLI**: Direct wallet integration with private keys

### 2. **Simplified Architecture**
- **Original**: Complex 1inch Fusion+ integration
- **CLI**: Streamlined HTLC-based swaps

### 3. **Direct Wallet Control**
- **Original**: Chain-abstracted wallet management
- **CLI**: User provides EVM and BTC private keys directly

## Implementation Details

### Bitcoin HTLC Implementation

The CLI includes the core Bitcoin HTLC functionality from the original project:

- **`createSrcHtlcScript()`**: Creates HTLC when BTC is source chain
- **`createDstHtlcScript()`**: Creates HTLC when BTC is destination chain
- **Script Features**:
  - Order hash for uniqueness
  - Time locks (relative/absolute)
  - Hash lock verification (SHA256)
  - Two spending paths (success/refund)

### EVM Integration

Simplified EVM integration with mock contracts:

- **Wallet Management**: Direct ethers.js integration
- **Contract Interaction**: Mock implementations for demonstration
- **Token Support**: Basic ERC20 and WETH support

### Swap Flows

#### EVM → BTC Flow
1. User creates swap order
2. User funds EVM escrow (mocked)
3. Resolver creates BTC HTLC
4. User claims BTC using secret
5. Resolver claims EVM tokens

#### BTC → EVM Flow
1. User creates swap order
2. User creates and funds BTC HTLC
3. Resolver creates EVM escrow (mocked)
4. User claims EVM tokens
5. Resolver claims BTC using secret

## Limitations

### 1. **Mock Contracts**
- EVM escrow creation is mocked
- Real implementation would require deployed contracts

### 2. **Hardcoded Resolver**
- Uses a single hardcoded resolver private key
- Production would need proper resolver management

### 3. **Testnet Only**
- Only works with Sepolia and BTC Testnet4
- No mainnet support

### 4. **Simplified Error Handling**
- Basic error handling for demonstration
- Production would need comprehensive error management

## File Structure

```
src/
├── btc/
│   ├── htlc.ts          # Bitcoin HTLC script creation
│   └── provider.ts      # Bitcoin RPC provider
├── evm/
│   ├── contracts.ts     # Contract ABIs
│   └── wallet.ts        # EVM wallet management
├── swap/
│   ├── evm-to-btc.ts    # EVM to BTC swap flow
│   └── btc-to-evm.ts    # BTC to EVM swap flow
├── cli/
│   └── index.ts         # Command-line interface
└── types/
    └── index.ts         # TypeScript definitions
```

## Usage Examples

### Interactive Mode
```bash
npm run dev interactive
```

### Direct Commands
```bash
# EVM to BTC
npm run dev evm-to-btc \
  --evm-key "0x1234..." \
  --btc-key "L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSxDizKSMxUU" \
  --amount "1000000000000000000"

# BTC to EVM
npm run dev btc-to-evm \
  --evm-key "0x1234..." \
  --btc-key "L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSxDizKSMxUU" \
  --amount "100000"
```

## Security Considerations

### 1. **Private Key Handling**
- Private keys are passed as command-line arguments
- Consider using environment variables for production
- Never log or store private keys

### 2. **HTLC Security**
- Uses proper Bitcoin script validation
- Implements time locks for refunds
- Secret revelation prevents double-spending

### 3. **Testnet Safety**
- Only works on testnets
- No real value at risk
- Safe for experimentation

## Future Improvements

### 1. **Real Contract Integration**
- Deploy actual escrow contracts
- Implement proper contract interactions
- Add contract verification

### 2. **Enhanced Security**
- Implement proper key management
- Add transaction signing verification
- Improve error handling

### 3. **Production Features**
- Mainnet support
- Multiple resolver support
- Partial fill support
- Better logging and monitoring

## Testing

The CLI includes basic testing capabilities:

```bash
# Test setup
npm run test-setup

# Run tests
npm test
```

## Dependencies

Key dependencies from the original project:

- **bitcoinjs-lib**: Bitcoin transaction handling
- **ecpair**: Bitcoin key pair management
- **@bitcoinerlab/secp256k1**: Cryptographic functions
- **bip68**: Bitcoin time lock encoding
- **ethers**: EVM interaction
- **commander**: CLI framework
- **inquirer**: Interactive prompts

## Conclusion

This CLI provides a simplified but functional implementation of atomic swaps between EVM and Bitcoin. While it uses mock contracts for demonstration, the core HTLC logic is production-ready and can be extended with real contract deployments for a complete solution.
