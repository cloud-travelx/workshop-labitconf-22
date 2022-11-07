import { IAlgoBuilderScriptFactory } from "@travelx/algob-ext/dist/ext/factory/model";
import { NFTData } from "../../model/nfticket/nfticket.data";
import { AssetInfo, CommonAccount, typed } from "@travelx/algob-ext";
import { ABIContract, AtomicTransactionComposer } from "algosdk";
import chalk from "chalk";
import { ABI } from "../../model/abi/contracts.abi";
import { IAccountsPlugin } from "../../model/plugin/accounts.plugin";
import { makeASAOptInTx } from "@algo-builder/algob/build/lib/tx";

interface NFTicketPlugin {
  nfticket: {
    app: number;
    appAccount: CommonAccount;
    contract: ABIContract;
    mint: (nft: NFTData) => Promise<AssetInfo>;
  }
}

type INFTicketPlugin = IAlgoBuilderScriptFactory.PluginWithDep<NFTicketPlugin, IAccountsPlugin>;

export const NfticketPlugin: INFTicketPlugin = (ctx) => {
  const contract = new ABIContract(ABI.NFTicket);
  const app = ctx.deployer.getApp("NFTicketManager");

  return {
    ...ctx,
    nfticket: {
      app: app.appID,
      contract,
      appAccount: { addr: app.applicationAccount, name: `NFTicketMgr ${app.appID}` },
      mint: async (nft) => {
        const composer = new AtomicTransactionComposer();
        console.log(chalk.gray(`[NFTicket::Plugin] Minting NFTicket ${nft.from}-${nft.to} [${chalk.italic(nft.metaUrl)}]`));
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
        console.log(chalk.gray(`[NFTicket::Plugin] Doing redeem`));
        const supplierRedeem = new AtomicTransactionComposer();
        supplierRedeem.addTransaction({
          signer: ctx.accounts.supplier.signer,
          txn: makeASAOptInTx(
            ctx.accounts.supplier.addr,
            nfticket,
            await ctx.deployerExt.suggestedParams(2000),
            { flatFee: true, totalFee: 1000 }
          )
        });
        supplierRedeem.addMethodCall({
          appID: app.appID,
          sender: ctx.accounts.supplier.addr,
          signer: ctx.accounts.supplier.signer,
          method: contract.getMethodByName("redeem"),
          methodArgs: [
            nfticket
          ],
          suggestedParams: await ctx.deployerExt.suggestedParams(2000)
        });
        await supplierRedeem.execute(ctx.deployer.algodClient, 1000);
        console.log(chalk.gray(`[NFTicket::Plugin] ✔ Supplier ${ctx.accounts.supplier.addr} hold NFTicket asset ${nfticket}`));

        return ctx.deployer.algodClient.getAssetByID(nfticket).do().then(typed<AssetInfo>());
      }
    }
  };
};