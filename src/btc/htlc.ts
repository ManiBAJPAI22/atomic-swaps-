import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory, ECPairInterface } from 'ecpair';
// @ts-ignore
import ecc from '@bitcoinerlab/secp256k1';
// @ts-ignore
import bip68 from 'bip68';

const ECPair = ECPairFactory(ecc);

export function addressToEthAddressFormat(btcAddress: string): string {
  const { data } = bitcoin.address.fromBech32(btcAddress);
  return `0x${data.toString('hex')}`;
}

export function publicKeyToAddress(publicKey: Buffer | string, network: bitcoin.Network): string {
  const pubkeyBuffer = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey;
  return bitcoin.payments.p2wpkh({ pubkey: pubkeyBuffer, network }).address!;
}

export function walletFromPrivateKey(
  privateKey: string,
  network: bitcoin.Network
): {
  keyPair: ECPairInterface;
  publicKey: Buffer;
  address: string;
} {
  let keyPair: ECPairInterface;
  
  // Check if it's WIF format (starts with c, L, K, or 5)
  if (privateKey.startsWith('c') || privateKey.startsWith('L') || privateKey.startsWith('K') || privateKey.startsWith('5')) {
    keyPair = ECPair.fromWIF(privateKey, network);
  } else {
    // Assume it's hex format
    keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'), { network });
  }
  
  const publicKey = Buffer.from(keyPair.publicKey);
  const address = publicKeyToAddress(publicKey, network);
  return {
    keyPair,
    publicKey,
    address
  };
}

export function createSrcHtlcScript(
  orderHashHex: string,
  hashLockSha256: Buffer,
  privateWithdrawal: number | bigint,
  privateCancellation: number | bigint,
  btcUserPublicKey: Buffer,
  btcResolverPublicKey: Buffer,
  lockTillPrivateWithdrawal: boolean = true
): Buffer {
  const scriptChunks: (Buffer | number)[] = [];

  // Include unique order hash at the start
  scriptChunks.push(Buffer.from(orderHashHex, 'hex'));
  scriptChunks.push(bitcoin.opcodes.OP_DROP);

  // Optional withdrawal lock
  if (lockTillPrivateWithdrawal) {
    scriptChunks.push(bitcoin.script.number.encode(bip68.encode({ seconds: Number(privateWithdrawal) })));
    scriptChunks.push(bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY);
    scriptChunks.push(bitcoin.opcodes.OP_DROP);
  }

  // Begin IF branch: hashlock & resolver
  scriptChunks.push(bitcoin.opcodes.OP_IF);
  scriptChunks.push(bitcoin.opcodes.OP_SHA256);
  scriptChunks.push(hashLockSha256);
  scriptChunks.push(bitcoin.opcodes.OP_EQUALVERIFY);
  scriptChunks.push(btcResolverPublicKey);
  scriptChunks.push(bitcoin.opcodes.OP_CHECKSIG);

  // ELSE branch: timeout & user
  scriptChunks.push(bitcoin.opcodes.OP_ELSE);
  scriptChunks.push(bitcoin.script.number.encode(bip68.encode({ seconds: Number(privateCancellation) })));
  scriptChunks.push(bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY);
  scriptChunks.push(bitcoin.opcodes.OP_DROP);
  scriptChunks.push(btcUserPublicKey);
  scriptChunks.push(bitcoin.opcodes.OP_CHECKSIG);

  scriptChunks.push(bitcoin.opcodes.OP_ENDIF);

  return bitcoin.script.compile(scriptChunks);
}

export function createDstHtlcScript(
  orderHashHex: string,
  hashLockSha256: Buffer,
  privateWithdrawal: number | bigint,
  privateCancellation: number | bigint,
  btcUserPublicKey: Buffer,
  btcResolverPublicKey: Buffer,
  lockTillPrivateWithdrawal: boolean = true
): Buffer {
  const scriptChunks: (Buffer | number)[] = [];

  // Always include a unique order hash at the start for protection
  scriptChunks.push(Buffer.from(orderHashHex, 'hex'));
  scriptChunks.push(bitcoin.opcodes.OP_DROP);

  if (lockTillPrivateWithdrawal) {
    // Optional timelock enforced at script level
    scriptChunks.push(bitcoin.script.number.encode(Number(privateWithdrawal)));
    scriptChunks.push(bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY);
    scriptChunks.push(bitcoin.opcodes.OP_DROP);
  }

  scriptChunks.push(bitcoin.opcodes.OP_IF);
  scriptChunks.push(bitcoin.opcodes.OP_SHA256);
  scriptChunks.push(hashLockSha256);
  scriptChunks.push(bitcoin.opcodes.OP_EQUALVERIFY);
  scriptChunks.push(btcUserPublicKey);
  scriptChunks.push(bitcoin.opcodes.OP_CHECKSIG);

  scriptChunks.push(bitcoin.opcodes.OP_ELSE);
  scriptChunks.push(bitcoin.script.number.encode(Number(privateCancellation)));
  scriptChunks.push(bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY);
  scriptChunks.push(bitcoin.opcodes.OP_DROP);
  scriptChunks.push(btcResolverPublicKey);
  scriptChunks.push(bitcoin.opcodes.OP_CHECKSIG);

  scriptChunks.push(bitcoin.opcodes.OP_ENDIF);

  return bitcoin.script.compile(scriptChunks);
}
