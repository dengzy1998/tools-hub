import { assertAdapter } from './chain-adapter.js';

export const EscrowState = Object.freeze({
  CREATED: 'CREATED',
  FUNDED: 'FUNDED',
  DELIVERED: 'DELIVERED',
  VERIFIED: 'VERIFIED',
  RELEASED: 'RELEASED',
  DISPUTED: 'DISPUTED',
  RESOLVED_REFUND: 'RESOLVED_REFUND',
  RESOLVED_RELEASE: 'RESOLVED_RELEASE',
  EXPIRED: 'EXPIRED'
});

const terminalStates = new Set([
  EscrowState.RELEASED,
  EscrowState.RESOLVED_REFUND,
  EscrowState.RESOLVED_RELEASE,
  EscrowState.EXPIRED
]);

export class Escrow {
  constructor({ id, posterId, workerId, amount, deadline, adapter, onEvent }) {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new TypeError('Escrow amount must be a non-negative safe integer in minor units');
    }
    if (!Number.isFinite(deadline)) throw new TypeError('Escrow deadline must be a timestamp');
    this.id = id;
    this.posterId = posterId;
    this.workerId = workerId;
    this.amount = amount;
    this.deadline = deadline;
    this.adapter = assertAdapter(adapter);
    this.onEvent = onEvent;
    this.state = EscrowState.CREATED;
    this.deliverableRef = null;
    this.events = [];
    this._record(this.state, 'Escrow created');
  }

  _requireState(...allowed) {
    if (!allowed.includes(this.state)) {
      throw new Error(`Cannot perform this action while escrow is ${this.state}; expected ${allowed.join(' or ')}`);
    }
  }

  _record(state, note, at = Date.now()) {
    const event = { state, at, note };
    this.events.push(event);
    if (this.onEvent) this.onEvent({ ...event });
  }

  _transition(state, note) {
    this.state = state;
    this._record(state, note);
    return this.state;
  }

  async fund() {
    this._requireState(EscrowState.CREATED);
    const txId = await this.adapter.fundEscrow(this);
    return this._transition(EscrowState.FUNDED, `Funded${txId ? ` (${txId})` : ''}`);
  }

  deliver(deliverableRef) {
    this._requireState(EscrowState.FUNDED);
    if (Date.now() > this.deadline) throw new Error('Cannot deliver after the escrow deadline');
    this.deliverableRef = deliverableRef;
    return this._transition(EscrowState.DELIVERED, 'Work delivered');
  }

  verify() {
    this._requireState(EscrowState.DELIVERED);
    return this._transition(EscrowState.VERIFIED, 'Work verified by poster');
  }

  async release() {
    this._requireState(EscrowState.VERIFIED);
    const txId = await this.adapter.releasePayment(this);
    return this._transition(EscrowState.RELEASED, `Payment released${txId ? ` (${txId})` : ''}`);
  }

  dispute(reason) {
    this._requireState(EscrowState.DELIVERED, EscrowState.VERIFIED);
    return this._transition(EscrowState.DISPUTED, String(reason));
  }

  async resolveDispute(outcome) {
    this._requireState(EscrowState.DISPUTED);
    if (outcome === 'refund') {
      const txId = await this.adapter.refundEscrow(this);
      return this._transition(EscrowState.RESOLVED_REFUND, `Dispute resolved with refund${txId ? ` (${txId})` : ''}`);
    }
    if (outcome === 'release') {
      const txId = await this.adapter.releasePayment(this);
      return this._transition(EscrowState.RESOLVED_RELEASE, `Dispute resolved with release${txId ? ` (${txId})` : ''}`);
    }
    throw new Error(`Invalid dispute outcome ${JSON.stringify(outcome)}; expected 'refund' or 'release'`);
  }

  async checkTimeout(now = Date.now()) {
    if (now <= this.deadline) return this.state;
    if (this.state === EscrowState.FUNDED) {
      const txId = await this.adapter.refundEscrow(this);
      return this._transition(EscrowState.EXPIRED, `Deadline passed; funded escrow refunded${txId ? ` (${txId})` : ''}`, now);
    }
    if (this.state === EscrowState.CREATED) {
      return this._transition(EscrowState.EXPIRED, 'Deadline passed before funding', now);
    }
    return this.state;
  }

  getState() {
    return {
      id: this.id,
      posterId: this.posterId,
      workerId: this.workerId,
      amount: this.amount,
      state: this.state,
      deliverableRef: this.deliverableRef,
      events: this.events.map(event => ({ ...event }))
    };
  }

  isTerminal() {
    return terminalStates.has(this.state);
  }
}
