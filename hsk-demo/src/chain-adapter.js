/**
 * Chain adapter contract:
 * - fundEscrow(escrow): Promise<txOrRecordId>
 * - releasePayment(escrow): Promise<txOrRecordId>
 * - refundEscrow(escrow): Promise<txOrRecordId>
 */
export function assertAdapter(adapter) {
  const required = ['fundEscrow', 'releasePayment', 'refundEscrow'];
  for (const method of required) {
    if (!adapter || typeof adapter[method] !== 'function') {
      throw new Error(`Invalid chain adapter: missing required method ${method}()`);
    }
  }
  return adapter;
}
