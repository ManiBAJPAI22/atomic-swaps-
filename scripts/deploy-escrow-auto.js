const { ethers } = require('ethers');
const solc = require('solc');
const fs = require('fs');
const path = require('path');

// PYUSD ABI
const PYUSD_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)"
];

async function deployEscrowAuto() {
  // Configuration
  const privateKey = '1009aeecc8509ac354e5dd2d765ba5a5d0da75f311ffed141f8d0d2fb2c14556';
  const rpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l';
  const pyusdAddress = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
  const makerAddress = '0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B';
  const fundAmount = ethers.parseUnits('10', 6); // 10 PYUSD

  console.log('🚀 Auto-Deploying and Funding Escrow Contract...');
  console.log('📤 Deployer:', new ethers.Wallet(privateKey).address);
  console.log('💰 PYUSD Token:', pyusdAddress);
  console.log('👤 Maker Address:', makerAddress);
  console.log('💵 Funding Amount:', ethers.formatUnits(fundAmount, 6), 'PYUSD');

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  try {
    // Check PYUSD balance
    const pyusdContract = new ethers.Contract(pyusdAddress, PYUSD_ABI, wallet);
    const balance = await pyusdContract.balanceOf(wallet.address);
    console.log('💰 Current PYUSD Balance:', ethers.formatUnits(balance, 6), 'PYUSD');

    if (balance < fundAmount) {
      console.log('❌ Insufficient PYUSD balance for funding escrow');
      console.log('💡 Please ensure your account has at least 10 PYUSD');
      return;
    }

    // Read and compile the Escrow contract
    const contractPath = path.resolve(__dirname, '../contracts/Escrow.sol');
    const sourceCode = fs.readFileSync(contractPath, 'utf8');

    const input = {
      language: 'Solidity',
      sources: {
        'Escrow.sol': {
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

    console.log('📝 Compiling Escrow contract...');
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors && output.errors.length > 0) {
      console.error('❌ Compilation errors:', output.errors);
      return;
    }

    const contractOutput = output.contracts['Escrow.sol']['Escrow'];
    const abi = contractOutput.abi;
    const bytecode = contractOutput.evm.bytecode.object;

    console.log('✅ Contract compiled successfully');

    // Deploy the contract
    console.log('🚀 Deploying Escrow contract...');
    const EscrowFactory = new ethers.ContractFactory(abi, bytecode, wallet);
    const escrow = await EscrowFactory.deploy(pyusdAddress, makerAddress);
    console.log('⏳ Deployment transaction sent:', escrow.deploymentTransaction().hash);
    
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();
    console.log('✅ Escrow Contract deployed to:', escrowAddress);
    console.log('🔗 Explorer: https://sepolia.etherscan.io/address/' + escrowAddress);

    // Fund the escrow
    console.log(`\n💰 Funding Escrow with ${ethers.formatUnits(fundAmount, 6)} PYUSD...`);

    // Approve the escrow to spend PYUSD
    const approveTx = await pyusdContract.approve(escrowAddress, fundAmount);
    console.log('⏳ Approving PYUSD transfer...', approveTx.hash);
    await approveTx.wait();
    console.log('✅ PYUSD approval confirmed');

    // Fund the escrow
    const fundTx = await escrow.fundEscrow(fundAmount);
    console.log('⏳ Funding escrow...', fundTx.hash);
    await fundTx.wait();
    console.log('✅ Escrow funded successfully!');

    // Verify the funding
    const escrowBalance = await pyusdContract.balanceOf(escrowAddress);
    console.log(`✅ Escrow now holds: ${ethers.formatUnits(escrowBalance, 6)} PYUSD`);

    console.log('\n🎉 Deployment and Funding Complete!');
    console.log('📋 Summary:');
    console.log('   Escrow Address:', escrowAddress);
    console.log('   PYUSD Balance:', ethers.formatUnits(escrowBalance, 6), 'PYUSD');
    console.log('   Maker Address:', makerAddress);
    console.log('');
    console.log('🚀 Now you can run the Escrow demo:');
    console.log(`   npm run demo-escrow -- --escrow-address ${escrowAddress}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
  }
}

if (require.main === module) {
  deployEscrowAuto().catch(console.error);
}

module.exports = { deployEscrowAuto };
