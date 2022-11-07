import { hash as SHA512_256 } from '@stablelib/sha512_256';
import { v4 as uuid } from 'uuid';

export interface NFTData {
  from: string;
  to: string;
  nfticketId: string
  metaUrl: string
  metaHash: Uint8Array
}

export const nftData = (from: string, to: string, overrides: Partial<NFTData> = {}): NFTData => {
  const nfticketId = uuid().toUpperCase();
  const metaUrl = 'ipfs:/' + Buffer.from(SHA512_256(Buffer.from(nfticketId))).toString('base64');
  const metaHash = SHA512_256(Buffer.from(metaUrl));

  return {
    from, to,
    nfticketId,
    metaUrl,
    metaHash,
    ...overrides
  };
};