import { Account } from "@algo-builder/runtime/build/types";
import { makeBasicAccountTransactionSigner, TransactionSigner } from "algosdk";
import { IAlgoBuilderScriptFactory } from "@travelx/algob-ext/dist/ext/factory/model";

export declare type AccountWithSigner = Account & { signer: TransactionSigner };

export interface IAccounts {
  accounts: {
    master: AccountWithSigner;
    supplier: AccountWithSigner;
    protocol: AccountWithSigner;
    alice: AccountWithSigner;
    bob: AccountWithSigner
  }
}

export type IAccountsPlugin = IAlgoBuilderScriptFactory.Plugin<IAccounts>;

export const AccountsPlugin: IAccountsPlugin = (ctx) => {
  const accountFor = (name: string): AccountWithSigner => {
    const account = ctx.deployer.accountsByName.get(name)!;
    return { ...account, signer: makeBasicAccountTransactionSigner(account) };
  };
  return {
    ...ctx,
    accounts: {
      master: accountFor('master'),
      supplier: accountFor('supplier'),
      protocol: accountFor('protocol'),
      alice: accountFor('alice'),
      bob: accountFor('bob')
    }
  };
};