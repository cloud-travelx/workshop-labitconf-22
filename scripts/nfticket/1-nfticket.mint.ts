import { accountsBalanceReference, AlgoBuilderScriptFactory, InspectorPlugin } from "@travelx/algob-ext";
import { AccountsPlugin } from "../model/plugin/accounts.plugin";
import { ABIContract, AtomicTransactionComposer } from "algosdk";
import { ABI } from "../model/abi/contracts.abi";
import { nftData } from "../model/nfticket/nfticket.data";
import chalk from "chalk";
import { makeASAOptInTx } from "@algo-builder/algob/build/lib/tx";
import { assert } from "../model/assert";

const script = AlgoBuilderScriptFactory()
  .withPlugin(InspectorPlugin)
  .withPlugin(AccountsPlugin);

export default script.of(async ctx => {
  const contract = new ABIContract(ABI.NFTicket);
  const app = ctx.deployer.getApp("NFTicketManager");
  const appAccount = { name: `NFTicket ${app.appID}`, addr: app.applicationAccount };
  ctx.inspector.registerAccount(appAccount);

  const balanceRef = await accountsBalanceReference(ctx.deployerExt)
    .of([ctx.accounts.supplier, appAccount]);

  const composer = new AtomicTransactionComposer();
  const nft = nftData('BUE', 'MIA');
  console.log(`🛫 Minting NFTicket ${nft.from}-${nft.to} [${chalk.gray.italic(nft.metaUrl)}]`);
  composer.addMethodCall({
    appID: app.appID,
    sender: ctx.accounts.supplier.addr,
    signer: ctx.accounts.supplier.signer,
    method: contract.getMethodByName("mint"),
    methodArgs: [
      `${nft.from}-${nft.to}`,
      nft.metaUrl,
      nft.metaHash
    ],
    suggestedParams: await ctx.deployerExt.suggestedParams(2000)
  });
  const res = await composer.execute(ctx.deployer.algodClient, 10000);
  const nfticket = Number(res.methodResults[0].returnValue as number);
  console.log(`✅  Mint Completed. ${chalk.bgWhiteBright.bold.black(`NFTicket asset ${nfticket}`)}`);

  console.log(`📩 Redeem ticket to supplier`);
  const redeem = new AtomicTransactionComposer();
  redeem.addTransaction({
    signer: ctx.accounts.supplier.signer,
    txn: makeASAOptInTx(
      ctx.accounts.supplier.addr,
      nfticket,
      await ctx.deployerExt.suggestedParams(2000),
      { flatFee: true, totalFee: 1000 }
    )
  });
  redeem.addMethodCall({
    appID: app.appID,
    sender: ctx.accounts.supplier.addr,
    signer: ctx.accounts.supplier.signer,
    method: contract.getMethodByName("redeem"),
    methodArgs: [
      nfticket
    ],
    suggestedParams: await ctx.deployerExt.suggestedParams(2000)
  });
  await redeem.execute(ctx.deployer.algodClient, 1000);
  const hasNFTicket = await ctx.deployerExt.nftsOf(ctx.accounts.supplier)
    .then((n) => n.some((a) => a.asset_id === nfticket));
  assert(`Supplier has ${chalk.bgWhiteBright.bold.black(`NFTicket asset ${nfticket}`)}`, hasNFTicket);

  await balanceRef.printDiff();
  await ctx.inspector.showSummary();

  const nfticketChainData = await ctx.deployer.getAssetByID(nfticket);
  console.log(chalk.gray.italic(JSON.stringify(nfticketChainData, null, 2)));
});