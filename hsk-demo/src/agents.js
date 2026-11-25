import { Escrow } from './escrow-core.js';

export class PosterAgent {
  constructor(id = 'agent-a') {
    this.id = id;
  }

  postTask(adapter, { workerId = 'agent-b', amount = 500, deadline = Date.now() + 60_000, id = `escrow-${Date.now()}` } = {}) {
    return new Escrow({ id, posterId: this.id, workerId, amount, deadline, adapter });
  }

  async fund(escrow) {
    return escrow.fund();
  }

  verify(escrow) {
    return escrow.verify();
  }

  async release(escrow) {
    return escrow.release();
  }
}

export class WorkerAgent {
  constructor(id = 'agent-b') {
    this.id = id;
  }

  accept(escrow) {
    if (escrow.workerId !== this.id) throw new Error(`Worker ${this.id} is not assigned to escrow ${escrow.id}`);
    if (escrow.state !== 'FUNDED') throw new Error(`Cannot accept escrow while it is ${escrow.state}`);
    return escrow;
  }

  deliver(escrow, deliverableRef = 'sample://deliverable') {
    this.accept(escrow);
    return escrow.deliver(deliverableRef);
  }
}

export async function runHappyPath(adapter) {
  const poster = new PosterAgent();
  const worker = new WorkerAgent();
  const escrow = poster.postTask(adapter, { id: 'happy-path', workerId: worker.id, amount: 500 });
  await poster.fund(escrow);
  worker.deliver(escrow);
  poster.verify(escrow);
  await poster.release(escrow);
  return { escrow, snapshot: escrow.getState() };
}

export async function runDisputePath(adapter) {
  const poster = new PosterAgent();
  const worker = new WorkerAgent();
  const escrow = poster.postTask(adapter, { id: 'dispute-path', workerId: worker.id, amount: 500 });
  await poster.fund(escrow);
  worker.deliver(escrow);
  escrow.dispute('Deliverable requires review');
  await escrow.resolveDispute('refund');
  return escrow.getState();
}
