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
  const fundAmount = ethers.parseUnits('1', 6); // 1 PYUSD

  // Silent deployment - no console output

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  try {
    // Check PYUSD balance
    const pyusdContract = new ethers.Contract(pyusdAddress, PYUSD_ABI, wallet);
    const balance = await pyusdContract.balanceOf(wallet.address);

    if (balance < fundAmount) {
      console.log('⚠️  Insufficient PYUSD balance for Escrow funding');
      return null;
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

    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    
    if (output.errors && output.errors.length > 0) {
      return null; // Silent failure
    }

    const contractOutput = output.contracts['Escrow.sol']['Escrow'];
    const abi = contractOutput.abi;
    const bytecode = contractOutput.evm.bytecode.object;

    // Deploy the contract silently
    const EscrowFactory = new ethers.ContractFactory(abi, bytecode, wallet);
    const escrow = await EscrowFactory.deploy(pyusdAddress, makerAddress);
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();

    // Fund the escrow silently
    const approveTx = await pyusdContract.approve(escrowAddress, fundAmount);
    await approveTx.wait();

    const fundTx = await escrow.fundEscrow(fundAmount);
    await fundTx.wait();

    return escrowAddress;

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    throw error;
  }
}

if (require.main === module) {
  deployEscrowAuto().catch(console.error);
}

module.exports = { deployEscrowAuto };
