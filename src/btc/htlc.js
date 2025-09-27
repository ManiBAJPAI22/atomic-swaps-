"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressToEthAddressFormat = addressToEthAddressFormat;
exports.publicKeyToAddress = publicKeyToAddress;
exports.walletFromPrivateKey = walletFromPrivateKey;
exports.createSrcHtlcScript = createSrcHtlcScript;
exports.createHtlcWithRecipientAddress = createHtlcWithRecipientAddress;
exports.createDstHtlcScript = createDstHtlcScript;
const bitcoin = __importStar(require("bitcoinjs-lib"));
const ecpair_1 = require("ecpair");
// @ts-ignore
const secp256k1_1 = __importDefault(require("@bitcoinerlab/secp256k1"));
// @ts-ignore
const bip68_1 = __importDefault(require("bip68"));
const ECPair = (0, ecpair_1.ECPairFactory)(secp256k1_1.default);
function addressToEthAddressFormat(btcAddress) {
    const { data } = bitcoin.address.fromBech32(btcAddress);
    return `0x${data.toString('hex')}`;
}
function publicKeyToAddress(publicKey, network) {
    const pubkeyBuffer = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey;
    return bitcoin.payments.p2wpkh({ pubkey: pubkeyBuffer, network }).address;
}
function walletFromPrivateKey(privateKey, network) {
    let keyPair;
    // Check if it's WIF format (starts with c, L, K, or 5)
    if (privateKey.startsWith('c') || privateKey.startsWith('L') || privateKey.startsWith('K') || privateKey.startsWith('5')) {
        keyPair = ECPair.fromWIF(privateKey, network);
    }
    else {
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
function createSrcHtlcScript(orderHashHex, hashLockSha256, privateWithdrawal, privateCancellation, btcUserPublicKey, btcResolverPublicKey, lockTillPrivateWithdrawal = true) {
    const scriptChunks = [];
    // Include unique order hash at the start
    scriptChunks.push(Buffer.from(orderHashHex, 'hex'));
    scriptChunks.push(bitcoin.opcodes.OP_DROP);
    // Optional withdrawal lock
    if (lockTillPrivateWithdrawal) {
        scriptChunks.push(bitcoin.script.number.encode(bip68_1.default.encode({ seconds: Number(privateWithdrawal) })));
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
    scriptChunks.push(bitcoin.script.number.encode(bip68_1.default.encode({ seconds: Number(privateCancellation) })));
    scriptChunks.push(bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY);
    scriptChunks.push(bitcoin.opcodes.OP_DROP);
    scriptChunks.push(btcUserPublicKey);
    scriptChunks.push(bitcoin.opcodes.OP_CHECKSIG);
    scriptChunks.push(bitcoin.opcodes.OP_ENDIF);
    return bitcoin.script.compile(scriptChunks);
}
// New function for HTLC with specific recipient address
function createHtlcWithRecipientAddress(orderHashHex, hashLockSha256, privateWithdrawal, privateCancellation, recipientAddress, // Your specific address: tb1qpfrsr2k3t928vpuvrz0l4vdl3yyvpgwxleugmp
btcUserPublicKey, network = bitcoin.networks.testnet) {
    const scriptChunks = [];
    // Include unique order hash at the start
    scriptChunks.push(Buffer.from(orderHashHex, 'hex'));
    scriptChunks.push(bitcoin.opcodes.OP_DROP);
    // Optional withdrawal lock
    scriptChunks.push(bitcoin.script.number.encode(bip68_1.default.encode({ seconds: Number(privateWithdrawal) })));
    scriptChunks.push(bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY);
    scriptChunks.push(bitcoin.opcodes.OP_DROP);
    // Begin IF branch: hashlock & recipient address
    scriptChunks.push(bitcoin.opcodes.OP_IF);
    scriptChunks.push(bitcoin.opcodes.OP_SHA256);
    scriptChunks.push(hashLockSha256);
    scriptChunks.push(bitcoin.opcodes.OP_EQUALVERIFY);
    // Convert recipient address to script hash
    const recipientScriptHash = bitcoin.crypto.hash160(bitcoin.address.toOutputScript(recipientAddress, network));
    scriptChunks.push(bitcoin.opcodes.OP_DUP);
    scriptChunks.push(bitcoin.opcodes.OP_HASH160);
    scriptChunks.push(recipientScriptHash);
    scriptChunks.push(bitcoin.opcodes.OP_EQUALVERIFY);
    scriptChunks.push(bitcoin.opcodes.OP_CHECKSIG);
    // ELSE branch: timeout & user (refund)
    scriptChunks.push(bitcoin.opcodes.OP_ELSE);
    scriptChunks.push(bitcoin.script.number.encode(bip68_1.default.encode({ seconds: Number(privateCancellation) })));
    scriptChunks.push(bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY);
    scriptChunks.push(bitcoin.opcodes.OP_DROP);
    scriptChunks.push(btcUserPublicKey);
    scriptChunks.push(bitcoin.opcodes.OP_CHECKSIG);
    scriptChunks.push(bitcoin.opcodes.OP_ENDIF);
    return bitcoin.script.compile(scriptChunks);
}
function createDstHtlcScript(orderHashHex, hashLockSha256, privateWithdrawal, privateCancellation, btcUserPublicKey, btcResolverPublicKey, lockTillPrivateWithdrawal = true) {
    const scriptChunks = [];
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
//# sourceMappingURL=htlc.js.map