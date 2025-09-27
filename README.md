# Atomic Swap CLI

A command-line interface for atomic swaps between EVM Sepolia and BTC Testnet4. This CLI allows you to perform trustless cross-chain swaps using Hash Time-Locked Contracts (HTLCs).

## Features

- 🔄 **EVM → BTC Swaps**: Swap EVM tokens for Bitcoin
- 🔄 **BTC → EVM Swaps**: Swap Bitcoin for EVM tokens
- 🔐 **HTLC Security**: Uses Bitcoin HTLCs for atomic swaps
- 🎯 **Testnet Support**: Works with Sepolia and BTC Testnet4
- 💻 **CLI Interface**: Easy-to-use command-line interface
- 🔧 **Interactive Mode**: Guided setup for beginners

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd atomic-swap-cli
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Link the CLI globally (optional):
```bash
npm link
```

## Usage

### Interactive Mode (Recommended for beginners)

```bash
npm run dev interactive
# or
atomic-swap interactive
```

This will guide you through the swap process step by step.

### Direct Commands

#### EVM to BTC Swap

```bash
atomic-swap evm-to-btc \
  --evm-key "0x1234..." \
  --btc-key "L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSxDizKSMxUU" \
  --amount "1000000000000000000" \
  --evm-rpc "https://sepolia.infura.io/v3/YOUR_KEY" \
  --btc-rpc "https://blockstream.info/testnet/api"
```

#### BTC to EVM Swap

```bash
atomic-swap btc-to-evm \
  --evm-key "0x1234..." \
  --btc-key "L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSxDizKSMxUU" \
  --amount "100000" \
  --evm-rpc "https://sepolia.infura.io/v3/YOUR_KEY" \
  --btc-rpc "https://blockstream.info/testnet/api"
```

## Prerequisites

### EVM Setup (Sepolia)

1. **Get Sepolia ETH**: Use a faucet like [Sepolia Faucet](https://sepoliafaucet.com/)
2. **Get Testnet Tokens**: If using ERC20 tokens, get them from the appropriate testnet faucet
3. **RPC Access**: Use Infura, Alchemy, or your own Sepolia node

### BTC Setup (Testnet4)

1. **Get Testnet BTC**: Use [Bitcoin Testnet Faucet](https://coinfaucet.eu/en/btc-testnet/)
2. **RPC Access**: Use Blockstream's testnet API or run your own Bitcoin testnet node

### Wallet Setup

1. **EVM Wallet**: Export your private key from MetaMask or any EVM wallet
2. **BTC Wallet**: Generate a testnet private key or use an existing testnet wallet

## How It Works

### EVM → BTC Flow

1. **Order Creation**: User creates a swap order with secret and hash lock
2. **EVM Escrow**: User deposits EVM tokens into an escrow contract
3. **BTC HTLC**: Resolver creates and funds a Bitcoin HTLC
4. **User Claims BTC**: User reveals secret to claim BTC from HTLC
5. **Resolver Claims EVM**: Resolver uses secret to claim EVM tokens

### BTC → EVM Flow

1. **Order Creation**: User creates a swap order with secret and hash lock
2. **BTC HTLC**: User creates and funds a Bitcoin HTLC
3. **EVM Escrow**: Resolver creates and funds an EVM escrow
4. **User Claims EVM**: User reveals secret to claim EVM tokens
5. **Resolver Claims BTC**: Resolver uses secret to claim BTC

## Security Features

- **Hash Time-Locked Contracts**: Ensures atomicity of swaps
- **Secret Revelation**: Uses cryptographic secrets to prevent double-spending
- **Time Locks**: Automatic refunds if swaps aren't completed in time
- **Testnet Only**: Safe testing environment with no real value at risk

## Configuration

### Environment Variables

You can set default values using environment variables:

```bash
export EVM_PRIVATE_KEY="0x1234..."
export BTC_PRIVATE_KEY="L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSxDizKSMxUU"
export EVM_RPC_URL="https://sepolia.infura.io/v3/YOUR_KEY"
export BTC_RPC_URL="https://blockstream.info/testnet/api"
```

### RPC Endpoints

- **Sepolia**: `https://sepolia.infura.io/v3/YOUR_KEY`
- **BTC Testnet**: `https://blockstream.info/testnet/api`

## Troubleshooting

### Common Issues

1. **Insufficient Balance**: Ensure you have enough testnet tokens
2. **RPC Errors**: Check your RPC endpoint URLs
3. **Private Key Format**: Ensure private keys are in correct format
4. **Network Issues**: Check your internet connection

### Debug Mode

Run with debug logging:

```bash
DEBUG=* atomic-swap interactive
```

## Development

### Project Structure

```
src/
├── btc/           # Bitcoin HTLC implementation
├── evm/           # EVM contract integration
├── swap/          # Swap flow implementations
├── cli/           # Command-line interface
└── types/         # TypeScript type definitions
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## Limitations

- **Testnet Only**: This implementation only works on testnets
- **Mock Contracts**: Some EVM contract interactions are mocked for simplicity
- **Single Resolver**: Uses a hardcoded resolver for demonstration
- **No Partial Fills**: Swaps must be completed in full

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This software is for educational and testing purposes only. Use at your own risk. Always test thoroughly before using with real funds.
