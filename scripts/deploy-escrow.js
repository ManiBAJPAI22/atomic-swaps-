const { ethers } = require('ethers');

// Contract ABI
const escrowABI = [
  "constructor(address _pyusdToken, address _makerAddress)",
  "function fundEscrow(uint256 amount) external",
  "function completeSwap(uint256 amount, string memory swapId) external",
  "function getEscrowBalance() external view returns (uint256)",
  "function getContractInfo() external view returns (address, address, address, uint256)",
  "event PyusdSentToMaker(address indexed maker, uint256 amount, string swapId)",
  "event EscrowFunded(uint256 amount)"
];

const pyusdABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];

async function deployEscrow() {
  // Configuration
  const privateKey = '1009aeecc8509ac354e5dd2d765ba5a5d0da75f311ffed141f8d0d2fb2c14556';
  const rpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l'; // Your actual API key
  const pyusdAddress = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
  const makerAddress = '0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B';
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('🚀 Deploying Escrow Contract...');
  console.log('📤 Deployer:', wallet.address);
  console.log('💰 PYUSD Token:', pyusdAddress);
  console.log('👤 Maker Address:', makerAddress);
  
  try {
    // Check PYUSD balance
    const pyusdContract = new ethers.Contract(pyusdAddress, pyusdABI, provider);
    const balance = await pyusdContract.balanceOf(wallet.address);
    console.log('💰 PYUSD Balance:', ethers.formatUnits(balance, 6), 'PYUSD');
    
    if (balance < ethers.parseUnits('100', 6)) {
      console.log('⚠️  Warning: Low PYUSD balance. Consider funding the account first.');
    }
    
    // Deploy contract (this is a placeholder - you'd need the actual bytecode)
    console.log('📝 Contract deployment would happen here...');
    console.log('💡 After deployment:');
    console.log('   1. Fund the escrow with PYUSD');
    console.log('   2. Update the swap code to call completeSwap()');
    console.log('   3. The contract will send PYUSD to maker when swap completes');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

deployEscrow().catch(console.error);
