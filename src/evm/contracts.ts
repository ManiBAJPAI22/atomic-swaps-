// Simplified contract ABIs for the atomic swap functionality
export const ESCROW_FACTORY_ABI = [
  "function createEscrow(address maker, address taker, uint256 amount, bytes32 orderHash, bytes32 hashLock, uint256 timelock) external returns (address)",
  "function getEscrow(bytes32 orderHash) external view returns (address)",
  "event EscrowCreated(address indexed escrow, address indexed maker, address indexed taker, uint256 amount, bytes32 orderHash)"
];

export const ESCROW_ABI = [
  "function withdraw(bytes32 secret) external",
  "function cancel() external",
  "function getOrderHash() external view returns (bytes32)",
  "function getHashLock() external view returns (bytes32)",
  "function getMaker() external view returns (address)",
  "function getTaker() external view returns (address)",
  "function getAmount() external view returns (uint256)",
  "function getTimelock() external view returns (uint256)",
  "function isWithdrawn() external view returns (bool)",
  "function isCancelled() external view returns (bool)"
];

export const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];

export const WETH_ABI = [
  "function deposit() external payable",
  "function withdraw(uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)"
];
