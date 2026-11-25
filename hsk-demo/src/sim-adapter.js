import { assertAdapter } from './chain-adapter.js';

export class SimChainAdapter {
  constructor(initialBalances = {}) {
    this.balances = new Map();
    this.holdings = new Map();
    this.nextTx = 1;
    for (const [accountId, balance] of Object.entries(initialBalances)) {
      this._validateAmount(balance, `Initial balance for ${accountId}`);
      this.balances.set(accountId, balance);
    }
    assertAdapter(this);
  }

  _validateAmount(amount, label = 'Amount') {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new TypeError(`${label} must be a non-negative safe integer in minor units`);
    }
  }

  _balance(accountId) {
    return this.balances.get(accountId) ?? 0;
  }

  _tx() {
    return `sim-tx-${this.nextTx++}`;
  }

  async fundEscrow(escrow) {
    this._validateAmount(escrow.amount);
    const balance = this._balance(escrow.posterId);
    if (balance < escrow.amount) throw new Error(`Insufficient funds for ${escrow.posterId}`);
    this.balances.set(escrow.posterId, balance - escrow.amount);
    this.holdings.set(escrow.id, (this.holdings.get(escrow.id) ?? 0) + escrow.amount);
    return this._tx();
  }

  async releasePayment(escrow) {
    const holding = this.getHolding(escrow.id);
    if (holding < escrow.amount) throw new Error(`Insufficient escrow holding for ${escrow.id}`);
    this.holdings.set(escrow.id, holding - escrow.amount);
    this.balances.set(escrow.workerId, this._balance(escrow.workerId) + escrow.amount);
    return this._tx();
  }

  async refundEscrow(escrow) {
    const holding = this.getHolding(escrow.id);
    if (holding < escrow.amount) throw new Error(`Insufficient escrow holding for ${escrow.id}`);
    this.holdings.set(escrow.id, holding - escrow.amount);
    this.balances.set(escrow.posterId, this._balance(escrow.posterId) + escrow.amount);
    return this._tx();
  }

  getBalance(accountId) {
    return this._balance(accountId);
  }

  getHolding(escrowId) {
    return this.holdings.get(escrowId) ?? 0;
  }
}
