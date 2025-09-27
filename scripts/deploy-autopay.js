const { ethers } = require('ethers');
const solc = require('solc');
const fs = require('fs');
const path = require('path');

const PYUSD_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)"
];

async function deployAutoPay(merchantAddress, paymentAmount, paymentInterval, totalDuration) {
  const privateKey = '4a174f09cb14c06e2c21ea76afaa82a44ead86ca3d18110f87869c078d0bc559';
  const rpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l';
  const pyusdAddress = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  try {
    console.log('🔍 Checking PYUSD balance...');
    const pyusdContract = new ethers.Contract(pyusdAddress, PYUSD_ABI, wallet);
    const balance = await pyusdContract.balanceOf(wallet.address);
    console.log('💰 Current PYUSD balance:', ethers.formatUnits(balance, 6), 'PYUSD');

    // Calculate total amount needed for all payments
    const totalPayments = Math.floor(totalDuration / paymentInterval);
    const totalAmountNeeded = paymentAmount * BigInt(totalPayments);
    
    if (balance < totalAmountNeeded) {
      console.log('❌ Insufficient PYUSD balance for AutoPay');
      console.log('   Required:', ethers.formatUnits(totalAmountNeeded, 6), 'PYUSD');
      console.log('   Available:', ethers.formatUnits(balance, 6), 'PYUSD');
      console.log('   Payment Amount:', ethers.formatUnits(paymentAmount, 6), 'PYUSD');
      console.log('   Total Payments:', totalPayments);
      return null;
    }

    console.log('📝 Compiling AutoPay contract...');
    const contractPath = path.resolve(__dirname, '../contracts/AutoPay.sol');
    const sourceCode = fs.readFileSync(contractPath, 'utf8');

    const input = {
      language: 'Solidity',
      sources: {
        'AutoPay.sol': {
          content: sourceCode,
        },
        '@openzeppelin/contracts/token/ERC20/IERC20.sol': {
          content: fs.readFileSync(path.resolve(__dirname, '../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol'), 'utf8'),
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode'],
          },
        },
      },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors && output.errors.length > 0) {
      console.error('❌ Compilation errors:', output.errors);
      return null;
    }

    const contractOutput = output.contracts['AutoPay.sol']['AutoPay'];
    const abi = contractOutput.abi;
    const bytecode = contractOutput.evm.bytecode.object;

    console.log('🚀 Deploying AutoPay contract...');
    console.log('   Merchant:', merchantAddress);
    console.log('   Payment Amount:', ethers.formatUnits(paymentAmount, 6), 'PYUSD');
    console.log('   Payment Interval:', paymentInterval, 'seconds');
    console.log('   Total Duration:', totalDuration, 'seconds');

    const AutoPayFactory = new ethers.ContractFactory(abi, bytecode, wallet);
    const autopay = await AutoPayFactory.deploy(
      merchantAddress,
      paymentAmount,
      paymentInterval,
      totalDuration,
      pyusdAddress
    );

    console.log('⏳ Waiting for deployment confirmation...');
    await autopay.waitForDeployment();
    const autopayAddress = await autopay.getAddress();

    console.log('💰 Transferring PYUSD to AutoPay contract...');
    console.log('   Payment Amount per interval:', ethers.formatUnits(paymentAmount, 6), 'PYUSD');
    console.log('   Total Payments:', totalPayments);
    console.log('   Total Amount Needed:', ethers.formatUnits(totalAmountNeeded, 6), 'PYUSD');
    
    const transferTx = await pyusdContract.transfer(autopayAddress, totalAmountNeeded);
    await transferTx.wait();

    console.log('✅ AutoPay contract deployed successfully!');
    console.log('📋 Contract Details:');
    console.log('   Address:', autopayAddress);
    console.log('   Merchant:', merchantAddress);
    console.log('   Payment Amount:', ethers.formatUnits(paymentAmount, 6), 'PYUSD');
    console.log('   Payment Interval:', paymentInterval, 'seconds');
    console.log('   Total Duration:', totalDuration, 'seconds');
    console.log('   Total Payments:', Math.floor(totalDuration / paymentInterval));
    console.log('🔗 Explorer: https://sepolia.etherscan.io/address/' + autopayAddress);

    return autopayAddress;

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    return null;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 4) {
    console.log('Usage: node deploy-autopay.js <merchant> <amount> <interval> <duration>');
    console.log('Example: node deploy-autopay.js 0x1234...5678 250000 360 1440');
    console.log('   merchant: EVM address to receive payments');
    console.log('   amount: Payment amount in PYUSD units (6 decimals)');
    console.log('   interval: Payment interval in seconds');
    console.log('   duration: Total duration in seconds');
    process.exit(1);
  }

  const merchantAddress = args[0];
  const paymentAmount = ethers.parseUnits(args[1], 6); // Convert decimal to PYUSD units (6 decimals)
  const paymentInterval = parseInt(args[2]); // seconds
  const totalDuration = parseInt(args[3]); // seconds

  deployAutoPay(merchantAddress, paymentAmount, paymentInterval, totalDuration)
    .then(address => {
      if (address) {
        console.log('\n🎉 AutoPay deployment completed successfully!');
        console.log('Next steps:');
        console.log('1. Start AutoPay: npm run manage-autopay ' + address + ' --action start');
        console.log('2. Check status: npm run manage-autopay ' + address + ' --action info');
      } else {
        console.log('\n❌ AutoPay deployment failed');
        process.exit(1);
      }
    })
    .catch(console.error);
}

module.exports = { deployAutoPay };
