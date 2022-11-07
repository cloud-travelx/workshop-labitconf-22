import { accountsBalanceReference, AlgoBuilderScriptFactory, CommonAccount, InspectorPlugin } from "@travelx/algob-ext";
import { AccountsPlugin } from "../model/plugin/accounts.plugin";
import { NfticketPlugin } from "./plugin/nfticket.plugin";
import { AtomicTransactionComposer } from "algosdk";
import { assert } from "../model/assert";

const script = AlgoBuilderScriptFactory()
  .withPlugin(AccountsPlugin)
  .withPlugin(InspectorPlugin)
  .withPlugin(NfticketPlugin);

export default script.of(async ctx => {
  await ctx.deployerExt.usdcDispenser(ctx.nfticket.appAccount, 50);
  
  const balanceRef = await accountsBalanceReference(ctx.deployerExt).of([
    ctx.nfticket.appAccount,
    ctx.accounts.supplier,
  ]);
  
  console.log('Doing withdraw 💳 from Supplier account ⬅️ NFTicket Manager');
  const withdraw = new AtomicTransactionComposer();
  withdraw.addMethodCall({
    sender: ctx.accounts.supplier.addr,
    signer: ctx.accounts.supplier.signer,
    appID: ctx.nfticket.app,
    method: ctx.nfticket.contract.getMethodByName('withdraw'),
    methodArgs: [
      ctx.deployerExt.resolveAssetIndex('usdc'),
      20 * 1e6,
      ctx.accounts.supplier.addr,
    ],
    suggestedParams: await ctx.deployerExt.suggestedParams(2000),
  });
  await withdraw.execute(ctx.deployer.algodClient, 1000);

  const diff = await balanceRef.diff();
  const diffOf = (acc: CommonAccount) => diff.find(a => a.account.addr === acc.addr)!.diff.usdc;
  assert('Supplier receive $20', diffOf(ctx.accounts.supplier) === 20);
  assert('NFTicket Manager balance -20', diffOf(ctx.nfticket.appAccount) === -20);

  await balanceRef.printDiff();
  await ctx.inspector.showSummary();
  
});