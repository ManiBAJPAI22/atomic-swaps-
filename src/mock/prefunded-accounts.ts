import { Wallet } from 'ethers';
import { ECPairFactory } from 'ecpair';
import * as ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

const ECPair = ECPairFactory(ecc);

export interface PrefundedAccount {
  evm: {
    address: string;
    privateKey: string;
    name: string;
  };
  btc: {
    address: string;
    privateKey: string;
    name: string;
  };
}

export class PrefundedAccountManager {
  private static instance: PrefundedAccountManager;
  private accounts: PrefundedAccount[] = [];

  private constructor() {
    this.initializeAccounts();
  }

  public static getInstance(): PrefundedAccountManager {
    if (!PrefundedAccountManager.instance) {
      PrefundedAccountManager.instance = new PrefundedAccountManager();
    }
    return PrefundedAccountManager.instance;
  }

  private initializeAccounts() {
    // Create a prefunded PYUSD account (simulating a liquidity provider)
    const pyusdProvider = Wallet.createRandom();
    const pyusdProviderBtc = ECPair.makeRandom({ network: bitcoin.networks.testnet });
    const pyusdProviderBtcAddress = bitcoin.payments.p2wpkh({ 
      pubkey: pyusdProviderBtc.publicKey, 
      network: bitcoin.networks.testnet 
    }).address;

    this.accounts.push({
      evm: {
        address: pyusdProvider.address,
        privateKey: pyusdProvider.privateKey,
        name: 'PYUSD Provider (Prefunded)'
      },
      btc: {
        address: pyusdProviderBtcAddress!,
        privateKey: pyusdProviderBtc.toWIF(),
        name: 'PYUSD Provider BTC'
      }
    });

    // Create a resolver account (for claiming BTC)
    const resolver = Wallet.createRandom();
    const resolverBtc = ECPair.makeRandom({ network: bitcoin.networks.testnet });
    const resolverBtcAddress = bitcoin.payments.p2wpkh({ 
      pubkey: resolverBtc.publicKey, 
      network: bitcoin.networks.testnet 
    }).address;

    this.accounts.push({
      evm: {
        address: resolver.address,
        privateKey: resolver.privateKey,
        name: 'Resolver (Claims BTC)'
      },
      btc: {
        address: resolverBtcAddress!,
        privateKey: resolverBtc.toWIF(),
        name: 'Resolver BTC'
      }
    });
  }

  public getPyusdProvider(): PrefundedAccount {
    return this.accounts[0]; // First account is PYUSD provider
  }

  public getResolver(): PrefundedAccount {
    return this.accounts[1]; // Second account is resolver
  }

  public getAllAccounts(): PrefundedAccount[] {
    return this.accounts;
  }

  public getAccountByEvmAddress(address: string): PrefundedAccount | undefined {
    return this.accounts.find(acc => acc.evm.address.toLowerCase() === address.toLowerCase());
  }

  public getAccountByBtcAddress(address: string): PrefundedAccount | undefined {
    return this.accounts.find(acc => acc.btc.address === address);
  }
}

export function getPrefundedAccounts(): PrefundedAccount[] {
  return PrefundedAccountManager.getInstance().getAllAccounts();
}

export function getPyusdProvider(): PrefundedAccount {
  return PrefundedAccountManager.getInstance().getPyusdProvider();
}

export function getResolver(): PrefundedAccount {
  return PrefundedAccountManager.getInstance().getResolver();
}
