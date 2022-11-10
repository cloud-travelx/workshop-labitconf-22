[<img style="background-color: 'black'; padding: 5px;" src=https://travelxchange.com/_next/static/media/travelx-logo.29530026.svg>](https://www.travelx.io)

[<img src="https://ticketing.labitconf.com/assets/images/logos/Logo_Nav_Bar.svg" width=100/>](https://en.labitconf.com/)

# 📄 Workshop

### Description
This workshop contains a PoC of how `Transfer-Controlled ASA` pattern works on Algorand.

### Content
The project contains only one contract: `NFTicketManager` which has 6 methods:
1. `🔒 set_up_asset(asset)`: Enable asset to operate NFTickets. This method will do opt-in of specified asset id. Only be called by __protocol address__
2. `🔒 set_up_asset(asset)`: Setup fee % of supplier and protocol. On each sell
3. `✈️ mint(name,url,hash)`: Only by airline. Generate (mint) new NFTicket (asset). The owner of NFTicket will be the NFTicketManager (it's the reserve)
4. `✈️ redeem(to)`: Only at first time, the supplier need the asset (NFTicket) to do the sell. This method move the NFTicket from `NFTicketManager` to `supplier` 
5. `✈️ withdraw(amount)`: Withdraw desired amount of supplier profit which the contract hold.
6. `sell(price,nfticket,buyer,payment)`: Main method of the contract. Allow to sell nfticket from owner to buyer. Need a transaction (in same [group](https://developer.algorand.org/docs/get-details/atomic_transfers/#group-transactions)) which paid (`axfer` to contract) the defined amount of the seller. If the contract validate parameters, the nfticket will be moved from owner to buyer. The specified protocol_fee will be transfer to protocol, supplier_fee will stay in the contract and the rest will be transferred to seller.


$$ seller_{profit} = price -  (\%fee_{protocol} + \%fee_{supplier}) $$

### Accounts
- **Supplier**: Simulate the airline which is allowed (by protocol) to _mint_ inventory as NFT
- **Protocol**: Account which manage the rules of NFTicket (governance) and receive profits foreach call
- **Alice**: Simulate a traveler which buy `NFTicket`

# 🚀 Set up

### Requirements
- Docker 🐳
- Algorand Sandbox. [readme](https://github.com/algorand/sandbox)
- NodeJS 14+ with yarn
- Python 3.10+ with Pipenv. [doc](https://pipenv.pypa.io/en/latest/#install-pipenv-today)

### Tools
- [@algob/algobuilder](https://algobuilder.dev/)
- [@travelx/algobuilder-ext](https://www.npmjs.com/package/@travelx/algob-ext)
- [pyteal](https://pypi.org/project/pyteal/) & [@algorand/beaker](https://pypi.org/project/beaker-pyteal/)


## Prepare environment
#### 1) Initialize pipenv
```bash
❯ pipenv install 

# For M1 chip with official python installation (through brew or pyenv is not required)
❯ pipenv install --python=/usr/local/bin/python3-intel64
```
#### 2) Yarn install
```bash
❯ yarn install
```

#### 3) Setup environment
_Just configure the algob file `algob.config.js` and setup master account using yarn script._

__‼️ IMPORTANT ‼️__: Start `sandbox` environment before setup _master_ account
```
❯ sandbox up
❯ yarn sandbox:account:master:config:env
```
> The command set on the repo config the master account public key and private key


#### Recommendations

- Put sandbox on the `$PATH`. _Edit you `.bashrc`/`.zshrc` adding `PATH=$PATH:/my/algorand/sandbox/location`_. This allow to run sandbox commands everywhere.

# ⌨️ Commands
- `❯ yarn build:watch`: Compile & watch typescript files to run with algobuilder.
- `❯ yarn algob deploy`: Deploy NFTicket smart contract and a mock of USDC
### Testing Scripts
- `❯ yarn algob run scripts/nfticket/1-nfticket.mint.ts`: Test mint NFTicket with supplier.
- `❯ yarn algob run scripts/nfticket/2-nfticket.sell.ts`: Test mint NFTicket and then sell it from supplier to Alice.
- `❯ yarn algob run scripts/nfticket/3-nfticket.withdrwa.ts`: Test withdraw supplier profit from NFTicket contract.

# 📁 Resources
- AlgoBuilder User Guide [[link](https://algobuilder.dev/guide/README)]
- Beaker docs [[link]](https://algorand-devrel.github.io/beaker/html/index.html)
- AlgoBuilder Smart Contract Examples [[link](https://github.com/scale-it/algo-builder/tree/master/examples)]
- Assets & custom transfer logic [link](https://developer.algorand.org/solutions/assets-and-custom-transfer-logic/)
- Dappflow sandbox explorer [link](https://app.dappflow.org/explorer/home)

# ✨ Challenges
- Manage multiple suppliers (local-storage)
- Split `sell` into `buy`/`sell`: Current sell method need one transaction signed by owner and other from buyer (or payer). Split it to define a price per ticket and then buyer can buy it async
- dApp to interact with contract