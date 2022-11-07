from typing import Final

import beaker as bkr
from pyteal import *


class NFTicketManager(bkr.Application):
    protocol: Final[bkr.ApplicationStateValue] = bkr.ApplicationStateValue(
        stack_type=TealType.bytes,
        static=True,
        descr="Protocol fee account",
    )

    protocol_fee: Final[bkr.ApplicationStateValue] = bkr.ApplicationStateValue(
        stack_type=TealType.uint64,
        default=Int(10),  # 1%
        descr="Protocol Fee Percentage",
    )

    supplier: Final[bkr.ApplicationStateValue] = bkr.ApplicationStateValue(
        stack_type=TealType.bytes,
        descr="Supplier account",
        static=True
    )

    supplier_share: Final[bkr.ApplicationStateValue] = bkr.ApplicationStateValue(
        stack_type=TealType.uint64,
        default=Int(1),
        descr="Share of supplier on resale"
    )

    @bkr.create
    def create(self, payment_asset: abi.Asset, protocol: abi.Account, supplier: abi.Account) -> Expr:
        return Seq(
            self.opt_in_payment_asset(payment_asset.asset_id()),
            self.initialize_application_state(),
            self.protocol.set(protocol.address()),
            self.supplier.set(supplier.address())
        )

    @bkr.internal(TealType.none)
    def opt_in_payment_asset(self, asset):
        return Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: asset,
                TxnField.asset_receiver: self.address,
                TxnField.asset_amount: Int(0),
                TxnField.fee: Int(0)
            }),
            InnerTxnBuilder.Submit(),
        )

    @bkr.external(authorize=bkr.Authorize.only(Global.creator_address()))
    def set_up_fee(self, supplier_share: abi.Uint64, protocol: abi.Uint64):
        return Seq(
            self.supplier_share.set(supplier_share.get()),
            self.protocol_fee.set(protocol.get())
        )

    @bkr.external
    def mint(self, name: abi.String, meta_url: abi.String, meta_hash: abi.String, *, output: abi.Uint64):
        # Create asset (set this contract as clawback)
        return Seq(
            # Check only Supplier can Mint
            Assert(Txn.sender() == self.supplier.get()),

            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetConfig,
                TxnField.config_asset_total: Int(1),
                TxnField.config_asset_decimals: Int(0),
                TxnField.config_asset_name: Concat(Bytes("NFTicket"), name.get()),
                TxnField.config_asset_unit_name: Bytes("NFTicket"),
                TxnField.config_asset_url: meta_url.get(),
                TxnField.config_asset_metadata_hash: meta_hash.get(),
                TxnField.config_asset_default_frozen: Int(1),
                TxnField.config_asset_reserve: Txn.sender(),
                TxnField.config_asset_manager: Global.current_application_address(),
                TxnField.config_asset_clawback: Global.current_application_address(),
                TxnField.config_asset_freeze: Global.current_application_address(),
                TxnField.fee: Int(0),
            }),
            InnerTxnBuilder.Submit(),

            output.set(Gitxn[0].created_asset_id())
        )

    @bkr.internal(TealType.none)
    def move_asset(self, asset: abi.Asset, owner, to):
        return Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: asset.asset_id(),
                TxnField.asset_sender: owner,
                TxnField.asset_receiver: to,
                TxnField.asset_amount: Int(1),
                TxnField.fee: Int(0),
            }),
            InnerTxnBuilder.Submit(),
        )

    @bkr.internal(TealType.none)
    def pay_share(self, asset, to, amount):
        return Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: asset,
                TxnField.asset_receiver: to,
                TxnField.asset_amount: amount,
                TxnField.fee: Int(0)
            }),
            InnerTxnBuilder.Submit(),
        )

    @bkr.external(authorize=bkr.Authorize.only(supplier))
    def withdraw(self, asset: abi.Asset, amount: abi.Uint64, to: abi.Account):
        return self.pay_share(asset.asset_id(), to.address(), amount.get())

    @bkr.external
    def sell(self,
             price: abi.Uint64,
             nfticket: abi.Asset,
             buyer: abi.Account,
             protocol: abi.Account,
             payment: abi.AssetTransferTransaction):
        payment = payment.get()
        return Seq(
            # Payment to contract
            #  (implicit) Payment asset
            Assert(payment.asset_receiver() == self.address),

            # Payment amount is sell price
            Assert(payment.asset_amount() >= price.get()),

            # Protocol Fee
            Assert(self.protocol.get() == protocol.address()),
            (protocol_fee := abi.Uint64()).set(price.get() * (self.protocol_fee.get() / Int(1000))),
            # Pay to Protocol
            self.pay_share(payment.xfer_asset(), protocol.address(), protocol_fee.get()),

            # Seller profit
            (seller_profit := abi.Uint64()).set(
                (price.get() - protocol_fee.get()) * (Int(1) - self.supplier_share.get() / Int(1000))
            ),
            # Pay to seller
            self.pay_share(payment.xfer_asset(), Txn.sender(), seller_profit.get()),

            # Move asset
            #  (implicit check) Seller is owner
            self.move_asset(nfticket, Txn.sender(), buyer.address())
        )


if __name__ == '__main__':
    import sys
    app = NFTicketManager()

    if len(sys.argv) > 1:
        if sys.argv[1] == "--abi":
            import json
            with open(__file__.replace(".py", ".abi.json"), "w") as abi_fp:
                json.dump(app.contract.dictify(), abi_fp, indent=2)
            sys.exit(1)

    print(app.approval_program)
