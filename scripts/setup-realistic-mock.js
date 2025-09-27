const { ethers } = require('ethers');

async function setupRealisticMock() {
  console.log('🎯 Setting up Realistic Mock Atomic Swap System\n');
  
  // Configuration
  const privateKey = '1009aeecc8509ac354e5dd2d765ba5a5d0da75f311ffed141f8d0d2fb2c14556';
  const rpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY'; // Replace with your RPC
  const pyusdAddress = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
  const makerAddress = '0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B';
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('📋 Configuration:');
  console.log('   Deployer:', wallet.address);
  console.log('   Maker Address:', makerAddress);
  console.log('   PYUSD Token:', pyusdAddress);
  console.log('   Network: Sepolia Testnet\n');
  
  try {
    // Check PYUSD balance
    const pyusdABI = ["function balanceOf(address account) external view returns (uint256)"];
    const pyusdContract = new ethers.Contract(pyusdAddress, pyusdABI, provider);
    const balance = await pyusdContract.balanceOf(wallet.address);
    const balanceFormatted = ethers.formatUnits(balance, 6);
    
    console.log('💰 PYUSD Balance Check:');
    console.log(`   Current Balance: ${balanceFormatted} PYUSD`);
    
    if (balance < ethers.parseUnits('10', 6)) {
      console.log('⚠️  Warning: Low PYUSD balance. Consider funding the account first.');
      console.log('💡 You can get testnet PYUSD from:');
      console.log('   - https://sepoliafaucet.com/');
      console.log('   - https://faucet.sepolia.dev/');
    } else {
      console.log('✅ Sufficient PYUSD balance for testing');
    }
    
    console.log('\n📝 Next Steps:');
    console.log('1. Deploy the Escrow contract:');
    console.log('   node scripts/deploy-escrow.js');
    console.log('');
    console.log('2. Fund the Escrow contract with PYUSD:');
    console.log('   - Call fundEscrow() with desired amount');
    console.log('   - This will transfer PYUSD from your account to the contract');
    console.log('');
    console.log('3. Update the swap code with the Escrow contract address');
    console.log('');
    console.log('4. Run the realistic mock swap:');
    console.log('   npx ts-node src/index.ts demo-mock');
    console.log('');
    console.log('🎯 The system will:');
    console.log('   - Simulate BTC HTLC creation');
    console.log('   - Call Escrow.completeSwap() to send real PYUSD to maker');
    console.log('   - Show real transaction hash on Etherscan');
    console.log('   - Maker will receive actual PYUSD tokens!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupRealisticMock().catch(console.error);
