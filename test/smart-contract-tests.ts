import { AccountStore, Runtime } from '@algo-builder/runtime';
import { types } from '@algo-builder/web';
import { assert, expect } from 'chai';
import { algosToMicroalgos } from 'algosdk';
import { ASADeploymentFlags, ASAInfo, } from '@algo-builder/runtime/build/types';
import { ExecParams, SignType, TransactionType } from "@algo-builder/web/build/types";

const BALANCE_MASTER = BigInt(algosToMicroalgos(100000));
const BALANCE_RECEIVER = BigInt(algosToMicroalgos(2));

describe('Algo Builder Test', function () {
  let master: AccountStore, receiver: AccountStore;

  let runtime: Runtime;

  this.beforeEach(async () => {
    master = new AccountStore(BALANCE_MASTER);
    receiver = new AccountStore(BALANCE_RECEIVER);
    runtime = new Runtime([master, receiver]);
  });

  const syncAccounts = (): void => {
    master = runtime.getAccount(master.address);
    receiver = runtime.getAccount(receiver.address);
  };

  it('Should transfer 1000 micro $ALGO from master to receiver', () => {
    assert.equal(receiver.balance(), BALANCE_RECEIVER);

    const amount = BigInt(1000);
    const fee = BigInt(1000);

    runtime.executeTx([{
      sign: SignType.SecretKey,
      type: TransactionType.TransferAlgo,
      fromAccount: master.account,
      toAccountAddr: receiver.address,
      amountMicroAlgos: amount,
      payFlags: { flatFee: true, totalFee: 1000 }
    }] as ExecParams[]);
    syncAccounts();

    assert.equal(master.balance(), BALANCE_MASTER - (amount + fee));
    assert.equal(receiver.balance(), BALANCE_RECEIVER + amount);
  });

  const createUsdc = (): ASAInfo => {
    const usdcFlags: ASADeploymentFlags = {
      creator: { ...master.account, name: 'master' },
    };
    return runtime.deployASA('usdc', usdcFlags);
  };

  it('Create & transfer USDC ASA', () => {
    const usdcIndex = createUsdc().assetIndex;

    runtime.optInToASA(usdcIndex, receiver.account.addr, {});
    syncAccounts();

    const receiverAsset = receiver.assets.get(usdcIndex);
    assert.isNotNull(receiverAsset);
    expect(receiverAsset?.amount).equal(BigInt(0));

    runtime.executeTx([{
      type: TransactionType.TransferAsset,
      sign: types.SignType.SecretKey,
      fromAccount: master.account,
      toAccountAddr: receiver.address,
      assetID: usdcIndex,
      amount: 1000,
      payFlags: { totalFee: 1000 },
    }]);
    syncAccounts();

    const updatedReceiverAssets = receiver.assets.get(usdcIndex);
    expect(updatedReceiverAssets?.amount).equal(BigInt(1000));

    expect(master.balance()).equal(BALANCE_MASTER - BigInt(1000));
  });
});
