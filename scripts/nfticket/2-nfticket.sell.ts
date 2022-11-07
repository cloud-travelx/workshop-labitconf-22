import { accountsBalanceReference, AlgoBuilderScriptFactory, InspectorPlugin } from "@travelx/algob-ext";
import { AccountsPlugin } from "../model/plugin/accounts.plugin";
import { NfticketPlugin } from "./plugin/nfticket.plugin";
import { nftData } from "../model/nfticket/nfticket.data";
import { AtomicTransactionComposer, makeAssetTransferTxnWithSuggestedParamsFromObject } from "algosdk";
import { makeASAOptInTx } from "@algo-builder/algob/build/lib/tx";
import { assert } from "../model/assert";

const script = AlgoBuilderScriptFactory()
  .withPlugin(AccountsPlugin)
  .withPlugin(InspectorPlugin)
  .withPlugin(NfticketPlugin);

export default script.of(async ctx => {
  const nfticketAsset = await ctx.nfticket.mint(nftData("BRC", "MDZ"));

  const balanceRef = await accountsBalanceReference(ctx.deployerExt).of([
    ctx.accounts.supplier,
    ctx.accounts.alice,
    ctx.accounts.protocol,
    ctx.nfticket.appAccount
  ]);

  const sellComposer = new AtomicTransactionComposer();
  sellComposer.addTransaction({
    signer: ctx.accounts.alice.signer,
    txn: makeASAOptInTx(
      ctx.accounts.alice.addr,
      nfticketAsset.index,
      await ctx.deployerExt.suggestedParams(1000),
      { flatFee: true, totalFee: 1000 }
    )
  });
  sellComposer.addMethodCall({
    appID: ctx.nfticket.app,
    sender: ctx.accounts.supplier.addr,
    signer: ctx.accounts.supplier.signer,
    method: ctx.nfticket.contract.getMethodByName("sell"),
    methodArgs: [
      Math.floor(100 * 1e6),
      nfticketAsset.index,
      ctx.accounts.alice.addr,
      ctx.accounts.protocol.addr,
      ctx.deployerExt.resolveAssetIndex('usdc'),
      {
        signer: ctx.accounts.alice.signer,
        txn: makeAssetTransferTxnWithSuggestedParamsFromObject({
          from: ctx.accounts.alice.addr,
          to: ctx.nfticket.appAccount.addr,
          assetIndex: ctx.deployerExt.resolveAssetIndex('usdc'),
          amount: Math.floor(100 * 1e6),
          suggestedParams: await ctx.deployerExt.suggestedParams(1000),
        })
      }
    ],
    suggestedParams: await ctx.deployerExt.suggestedParams(4000),
  });

  console.log(`Selling NFTicket ${nfticketAsset.index} from Supplier → Alice`);
  await sellComposer.execute(ctx.deployer.algodClient, 1000);

  const balanceDiff = await balanceRef.diff();
  const diffOf = (addr: string) => balanceDiff.find(a => a.account.addr === addr)!.diff;
  assert(`Protocol receive 1% of $100 [${diffOf(ctx.accounts.protocol.addr).usdc}]`, diffOf(ctx.accounts.protocol.addr).usdc === 1);

  const hasNFTicket = await ctx.deployerExt.nftsOf(ctx.accounts.alice)
    .then((nfts) => nfts.some((n) => n.asset_id === nfticketAsset.index));
  assert(`Alice has NFTicket ${nfticketAsset.index}`, hasNFTicket);

  await balanceRef.printDiff();
  await ctx.inspector.showSummary();

});