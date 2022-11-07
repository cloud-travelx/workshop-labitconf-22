import { accountsBalanceReference, AlgoBuilderScriptFactory } from "@travelx/algob-ext";
import chalk from "chalk";
import { AccountsPlugin } from "./model/plugin/accounts.plugin";
import { types } from "@algo-builder/web";
import {
  ABIContract,
  algosToMicroalgos,
  AtomicTransactionComposer,
  getApplicationAddress,
  makePaymentTxnWithSuggestedParamsFromObject
} from "algosdk";
import { ABI } from "./model/abi/contracts.abi";
import { uint64ToBigEndian } from "@algo-builder/web/build/lib/parsing";

const script = AlgoBuilderScriptFactory()
  .withPlugin(AccountsPlugin);

export default script.of(async (ctx) => {
  const balances = await accountsBalanceReference(ctx.deployerExt).of([
    ctx.accounts.master,
    ctx.accounts.protocol,
  ]);
  const nfticketContract = new ABIContract(ABI.NFTicket);

  const nfticketApp = await ctx.deployer.deployApp(
    ctx.accounts.master,
    {
      appName: 'NFTicketManager',
      metaType: types.MetaType.FILE,
      approvalProgramFilename: 'NFTicketManager.py',
      clearProgramFilename: 'NFTicketManager.clear.py',
      appArgs: [
        nfticketContract.getMethodByName('create').getSelector(),
        uint64ToBigEndian(1),
        uint64ToBigEndian(2)
      ],
      accounts: [
        ctx.accounts.protocol.addr,
        ctx.accounts.supplier.addr
      ],
      foreignAssets: [
        ctx.deployerExt.resolveAssetIndex('usdc')
      ],
      globalInts: 2,
      globalBytes: 2,
      localInts: 0,
      localBytes: 0
    },
    {},
    {}
  );

  console.log(`✅ Deployed NFTicket Manager ${chalk.bold.green(nfticketApp.appID)} [${chalk.gray(nfticketApp.applicationAccount)}]`);
  await balances.add([{ name: `NFTicket app ${nfticketApp.appID}`, addr: nfticketApp.applicationAccount }]);

  console.log('Set up contract USDC asset and fees');
  console.log(chalk.gray.italic(` [Supplier: 10% Protocol: 1%]`));
  const composer = new AtomicTransactionComposer();
  composer.addTransaction({
    signer: ctx.accounts.master.signer,
    txn: makePaymentTxnWithSuggestedParamsFromObject({
      from: ctx.accounts.master.addr,
      to: getApplicationAddress(nfticketApp.appID),
      amount: algosToMicroalgos(1),
      suggestedParams: await ctx.deployerExt.suggestedParams(1000)
    })
  });
  composer.addMethodCall({
    sender: ctx.accounts.protocol.addr,
    signer: ctx.accounts.protocol.signer,
    appID: nfticketApp.appID,
    method: nfticketContract.getMethodByName('set_up_asset'),
    methodArgs: [
      ctx.deployerExt.resolveAssetIndex('usdc')
    ],
    suggestedParams: await ctx.deployerExt.suggestedParams(2000)
  });
  composer.addMethodCall({
    sender: ctx.accounts.protocol.addr,
    signer: ctx.accounts.protocol.signer,
    appID: nfticketApp.appID,
    method: nfticketContract.getMethodByName('set_up_fee'),
    methodArgs: [
      Math.floor(0.1 * 1000), // supplier
      Math.floor(0.01 * 1000) // protocol
    ],
    suggestedParams: await ctx.deployerExt.suggestedParams(1000)
  });
  // eslint-disable-next-line sonarjs/no-nested-template-literals
  console.log(`Configuring ${chalk.white.bold(`NFTicket App ${nfticketApp.appID}`)}`);
  await composer.execute(ctx.deployer.algodClient, 1000);

  console.log(`✅ Done. NFTicket app ${nfticketApp.appID} [${nfticketApp.applicationAccount}] configured with USDC (${ctx.deployerExt.resolveAssetIndex('usdc')})`);

  await balances.printDiff();
});
