const { ethers } = require('ethers');

const PYUSD_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)"
];

async function fundAutoPay(autopayAddress, amount) {
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

    const transferAmount = ethers.parseUnits(amount, 6);
    console.log('💸 Transferring', amount, 'PYUSD to AutoPay contract...');
    console.log('   From:', wallet.address);
    console.log('   To:', autopayAddress);

    const transferTx = await pyusdContract.transfer(autopayAddress, transferAmount);
    console.log('⏳ Transaction submitted:', transferTx.hash);
    
    await transferTx.wait();
    console.log('✅ Transfer confirmed!');

    // Check new balances
    const newOwnerBalance = await pyusdContract.balanceOf(wallet.address);
    const newContractBalance = await pyusdContract.balanceOf(autopayAddress);
    
    console.log('\n📊 Updated Balances:');
    console.log('   Owner Balance:', ethers.formatUnits(newOwnerBalance, 6), 'PYUSD');
    console.log('   Contract Balance:', ethers.formatUnits(newContractBalance, 6), 'PYUSD');

    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node fund-autopay.js <autopay-address> <amount>');
    console.log('Example: node fund-autopay.js 0xe84F66D5C240B57e97b71fEae8919954219f3e85 0.25');
    process.exit(1);
  }

  const autopayAddress = args[0];
  const amount = args[1];

  fundAutoPay(autopayAddress, amount)
    .then(success => {
      if (success) {
        console.log('\n🎉 AutoPay funding completed successfully!');
        console.log('Next step: npm run manage-autopay ' + autopayAddress + ' start');
      } else {
        console.log('\n❌ AutoPay funding failed');
        process.exit(1);
      }
    })
    .catch(console.error);
}

module.exports = { fundAutoPay };
