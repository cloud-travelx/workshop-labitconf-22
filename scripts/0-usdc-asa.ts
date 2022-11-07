import { AlgoTransferParam, AssetTransferParam, SignType, TransactionType, } from '@algo-builder/web/build/types';
import * as algob from '@algo-builder/algob';
import { AlgoBuilderScriptFactory } from "@travelx/algob-ext";
import chalk from "chalk";

const script = AlgoBuilderScriptFactory();

export default script.of(async ({ runtimeEnv, deployer, deployerExt }) => {

  const master = deployer.accountsByName.get('master')!;

  const travelX = deployer.accountsByName.get('protocol')!;
  const airline = deployer.accountsByName.get('supplier')!;

  const alice = deployer.accountsByName.get('alice')!;
  const bob = deployer.accountsByName.get('bob')!;

  const accounts = [travelX, airline, alice, bob];

  console.log('Creating <usdc> ASA');
  const usdcCreateTX = await deployer.deployASA('usdc', {
    creator: master,
    flatFee: true,
    totalFee: 1000,
  });

  console.log(
    `✅ Created USDC ${usdcCreateTX.assetIndex} ${chalk.gray.italic(`TxID ${usdcCreateTX.txID} (block ${usdcCreateTX.confirmedRound})`)}`
  );

  const baseFunding: Omit<AlgoTransferParam, 'toAccountAddr'> = {
    type: TransactionType.TransferAlgo,
    sign: SignType.SecretKey,
    fromAccount: master,
    amountMicroAlgos: 200 * 1e6,
    payFlags: { totalFee: 1000, flatFee: true },
  };
  const funds = accounts.map(async ({ addr }): Promise<void> => {
    await deployer.executeTx([{ ...baseFunding, toAccountAddr: addr } as AlgoTransferParam]);
  });
  await Promise.all(funds);

  console.log('⚖️ Transferred 20 $ALGO to all accounts. Balances');
  await Promise.all(
    accounts.map(({ addr, name }) => {
      return deployerExt
        .algoBalanceOf({ addr, name })
        .then((amount) => console.log(`Balance for ${name}: ${amount} ALGO`));
    })
  );

  await Promise.all(
    accounts.map((account) => deployer.optInAccountToASA('usdc', account.name, {}))
  );

  console.log('📩 All accounts has USDC opted in');

  const baseUsdcFund: Partial<AssetTransferParam> = {
    type: TransactionType.TransferAsset,
    sign: SignType.SecretKey,
    fromAccount: master,
    amount: 10000 * 1e6,
    assetID: usdcCreateTX.assetIndex,
    payFlags: { flatFee: true, totalFee: 1000 },
  };

  await Promise.all(
    accounts.map((account) => {
      return deployer.executeTx([
        {
          ...baseUsdcFund,
          toAccountAddr: account.addr,
        } as AssetTransferParam
      ]);
    })
  );

  console.log('💸 Transferred 10K $USDC to all accounts. Balances');
  await Promise.all(
    accounts.map((account) =>
      algob
        .balanceOf(deployer, account.addr, usdcCreateTX.assetIndex)
        .then((amount) => console.log(`USDC balance for ${account.name}: $${amount}`))
    )
  );
});
