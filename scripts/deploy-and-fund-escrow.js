const { ethers } = require('ethers');

// Escrow contract ABI (simplified for deployment)
const escrowABI = [
  "constructor(address _pyusdToken, address _makerAddress)",
  "function fundEscrow(uint256 amount) external",
  "function completeSwap(uint256 amount, string memory swapId) external",
  "function getEscrowBalance() external view returns (uint256)",
  "function getContractInfo() external view returns (address, address, address, uint256)",
  "event PyusdSentToMaker(address indexed maker, uint256 amount, string swapId)",
  "event EscrowFunded(uint256 amount)"
];

// PYUSD ABI
const pyusdABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)"
];

// Escrow contract bytecode (this would be the actual compiled bytecode)
// For now, we'll simulate the deployment process
const escrowBytecode = "0x608060405234801561001057600080fd5b50600436106100575760003560e01c8063150b7a0211610030578063150b7a02146100a2578063a9059cbb146100b5578063f2fde38b146100c857600080fd5b8063017e7e581461005c57806306fdde031461007a578063095ea7b31461008f575b600080fd5b6100646100db565b604051610071919061012c565b60405180910390f35b6100826100ea565b604051610071919061013f565b6100a261009d3660046101a8565b610178565b005b6100a26100b03660046101c2565b6101e1565b6100a26100c33660046101a8565b6101f0565b6100a26100d63660046101fe565b61020f565b6000546001600160a01b031681565b6060600180546100f990610231565b80601f0160e0803d8211610120576040519150601f19603f3d011682016040523d82523d6000602084013e610125565b606091505b509091505090565b6001600160a01b0391909116815260200190565b600060208083528351808285015260005b8181101561016c57858101830151858201604001528201610150565b8181111561017e576000604083870101525b50601f01601f1916929092016040019392505050565b6001600160a01b0382166101a157600080fd5b600080546001600160a01b0319166001600160a01b0384161790555050565b6001600160a01b038116600080fd5b6001600160a01b038216600080fd5b600080546001600160a01b0319166001600160a01b03831617905550565b600080546001600160a01b0319166001600160a01b0392909216919091179055565b6001816000016000828254610225919061026c565b909155505050565b60006020828403121561023e57600080fd5b81356001600160a01b038116811461025557600080fd5b9392505050565b6000821982111561027f57634e487b7160e01b600052601160045260246000fd5b50019056fea2646970667358221220...";

async function deployAndFundEscrow() {
  // Configuration
  const privateKey = '1009aeecc8509ac354e5dd2d765ba5a5d0da75f311ffed141f8d0d2fb2c14556';
  const rpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l';
  const pyusdAddress = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
  const makerAddress = '0x777c5966E8327EbEcAbB21b043ACeDE9acBaCA7B';
  const fundAmount = ethers.parseUnits('10', 6); // 10 PYUSD
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('🚀 Deploying and Funding Escrow Contract...');
  console.log('📤 Deployer:', wallet.address);
  console.log('💰 PYUSD Token:', pyusdAddress);
  console.log('👤 Maker Address:', makerAddress);
  console.log('💵 Funding Amount:', ethers.formatUnits(fundAmount, 6), 'PYUSD');
  
  try {
    // Check PYUSD balance
    const pyusdContract = new ethers.Contract(pyusdAddress, pyusdABI, provider);
    const balance = await pyusdContract.balanceOf(wallet.address);
    console.log('💰 Current PYUSD Balance:', ethers.formatUnits(balance, 6), 'PYUSD');
    
    if (balance < fundAmount) {
      console.log('❌ Insufficient PYUSD balance for funding escrow');
      return;
    }
    
    console.log('\n📝 Deployment Steps:');
    console.log('1. Deploy Escrow contract with constructor args:');
    console.log(`   - _pyusdToken: ${pyusdAddress}`);
    console.log(`   - _makerAddress: ${makerAddress}`);
    console.log('');
    console.log('2. Fund the escrow with PYUSD:');
    console.log(`   - Call fundEscrow(${fundAmount.toString()})`);
    console.log('   - This will transfer PYUSD from your account to the contract');
    console.log('');
    console.log('3. Update the swap code with the deployed contract address');
    console.log('');
    console.log('💡 Use Remix IDE for easy deployment:');
    console.log('   - Go to https://remix.ethereum.org/');
    console.log('   - Create new file: Escrow.sol');
    console.log('   - Copy the contract code from contracts/Escrow.sol');
    console.log('   - Compile and deploy to Sepolia');
    console.log('   - Use your private key for deployment');
    console.log('   - After deployment, call fundEscrow() with 10 PYUSD');
    
    // Simulate the deployment process
    console.log('\n🎯 After deployment, your swap will:');
    console.log('   1. Start with BTC HTLC simulation');
    console.log('   2. Call escrow.completeSwap() when mock completes');
    console.log('   3. Escrow will send PYUSD to maker automatically');
    console.log('   4. Show real transaction hash on Etherscan');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deployAndFundEscrow().catch(console.error);
