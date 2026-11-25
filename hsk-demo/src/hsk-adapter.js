import { assertAdapter } from './chain-adapter.js';

export class HskChainAdapter {
  constructor({ rpcUrl, contractAddress, signer } = {}) {
    this.rpcUrl = rpcUrl;
    this.contractAddress = contractAddress;
    this.signer = signer;
    assertAdapter(this);
  }

  async fundEscrow(escrow) {
    // TODO: Look up the deployed escrow contract address for the configured environment.
    // TODO: Configure the HSK Chain id and RPC endpoint using this.rpcUrl.
    // TODO: Connect an ethers/viem contract instance using this.contractAddress.
    // TODO: Sign and submit the funding transaction with this.signer.
    return this._notImplemented('fundEscrow', escrow);
  }

  async releasePayment(escrow) {
    // TODO: Look up the deployed escrow contract address for the configured environment.
    // TODO: Configure the HSK Chain id and RPC endpoint using this.rpcUrl.
    // TODO: Connect an ethers/viem contract instance using this.contractAddress.
    // TODO: Sign and submit the release transaction with this.signer.
    return this._notImplemented('releasePayment', escrow);
  }

  async refundEscrow(escrow) {
    // TODO: Look up the deployed escrow contract address for the configured environment.
    // TODO: Configure the HSK Chain id and RPC endpoint using this.rpcUrl.
    // TODO: Connect an ethers/viem contract instance using this.contractAddress.
    // TODO: Sign and submit the refund transaction with this.signer.
    return this._notImplemented('refundEscrow', escrow);
  }

  _notImplemented(method, escrow) {
    throw new Error(`HskChainAdapter.${method} is not implemented (escrow ${escrow.id})`);
  }
}
