const { ethers } = require('ethers');

const AUTOPAY_ABI = [
  "function executePayment() external",
  "function getAutoPayInfo() external view returns (address, address, uint256, uint256, uint256, uint256, uint256, uint256, uint256, bool, bool)",
  "function getNextPaymentTime() external view returns (uint256)",
  "function getTimeRemaining() external view returns (uint256)"
];

async function autoExecutePayments(autopayAddress) {
  const privateKey = '4a174f09cb14c06e2c21ea76afaa82a44ead86ca3d18110f87869c078d0bc559';
  const rpcUrl = 'https://eth-sepolia.g.alchemy.com/v2/CQENf_IMmkawSrqgpR14l';

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const autopayContract = new ethers.Contract(autopayAddress, AUTOPAY_ABI, wallet);

  console.log('🚀 Starting AutoPay execution monitor...');
  console.log('📋 Contract Address:', autopayAddress);
  console.log('⏰ Monitoring for payment opportunities...\n');

  let paymentCount = 0;
  const maxPayments = 6;

  while (paymentCount < maxPayments) {
    try {
      // Get contract info
      const info = await autopayContract.getAutoPayInfo();
      const isActive = info[9];
      const remainingBalance = info[8];
      const paymentAmount = info[2];
      const nextPaymentTime = await autopayContract.getNextPaymentTime();
      const timeRemaining = await autopayContract.getTimeRemaining();

      console.log(`\n📊 Status Check #${paymentCount + 1}:`);
      console.log(`   Is Active: ${isActive}`);
      console.log(`   Remaining Balance: ${ethers.formatUnits(remainingBalance, 6)} PYUSD`);
      console.log(`   Payment Amount: ${ethers.formatUnits(paymentAmount, 6)} PYUSD`);
      console.log(`   Next Payment Time: ${new Date(Number(nextPaymentTime) * 1000).toLocaleString()}`);
      console.log(`   Time Remaining: ${Number(timeRemaining)} seconds`);

      if (!isActive) {
        console.log('❌ AutoPay is not active. Stopping monitor.');
        break;
      }

      if (remainingBalance < paymentAmount) {
        console.log('❌ Insufficient balance for payment. Stopping monitor.');
        break;
      }

      if (Number(timeRemaining) <= 0) {
        console.log('❌ AutoPay duration expired. Stopping monitor.');
        break;
      }

      // Check if it's time for payment
      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime >= Number(nextPaymentTime)) {
        console.log('💰 Executing payment...');
        
        try {
          const tx = await autopayContract.executePayment();
          console.log('⏳ Payment transaction submitted:', tx.hash);
          await tx.wait();
          console.log('✅ Payment executed successfully!');
          paymentCount++;
          
          // Check merchant balance
          const merchantAddress = info[1];
          const pyusdAddress = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
          const pyusdABI = ["function balanceOf(address account) external view returns (uint256)"];
          const pyusdContract = new ethers.Contract(pyusdAddress, pyusdABI, provider);
          const merchantBalance = await pyusdContract.balanceOf(merchantAddress);
          console.log(`🎯 Merchant balance: ${ethers.formatUnits(merchantBalance, 6)} PYUSD`);
          
        } catch (error) {
          console.log('❌ Payment execution failed:', error.message);
          if (error.message.includes('Payment interval not reached')) {
            console.log('⏳ Waiting for next payment interval...');
          } else {
            console.log('🛑 Stopping due to error.');
            break;
          }
        }
      } else {
        const waitTime = Number(nextPaymentTime) - currentTime;
        console.log(`⏳ Next payment in ${waitTime} seconds. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, Math.min(waitTime * 1000, 5000))); // Wait max 5 seconds
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
    }
  }

  console.log(`\n🎉 AutoPay execution completed! Total payments: ${paymentCount}`);
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node auto-execute-payments.js <autopay-address>');
    console.log('Example: node auto-execute-payments.js 0x3fB4f77A7e8E510FE4fDE591C6dE383De72f4f29');
    process.exit(1);
  }

  const autopayAddress = args[0];
  autoExecutePayments(autopayAddress).catch(console.error);
}

module.exports = { autoExecutePayments };
