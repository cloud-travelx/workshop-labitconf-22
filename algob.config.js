const {loadAccountsFromFileSync} = require('@algo-builder/algob');
const masterAccount = require("./config/master");
const addresses = require("./config/adresses");

const accountsFor = (env) => {
    return []
        .concat(masterAccount.masterFor(env))
        .concat(loadAccountsFromFileSync('config/accounts.yaml'))
}

const networks = {
    default: {
        host: 'http://localhost',
        port: 4001,
        token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        //  Automated script: `yarn run --silent sandbox:account:master | pbcopy` and create master.local.js into config/master/
        accounts: accountsFor('local'),
        addresses: addresses.addressesFor('local'),
        indexerCfg: {
            host: 'http://localhost',
            port: 8980,
            token: '',
        }
    },
    TestNet: {
        host: 'https://testnet-api.algonode.cloud',
        port: 443,
        token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        accounts: accountsFor('testnet'),
        addresses: addresses.addressesFor('testnet'),
        indexerCfg: {
            host: 'https://testnet-idx.algonode.cloud',
            port: 443,
            token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        },
        assets: {
            usdc: 80830926 // USDX (Internal for TravelX)
        }
    },
}

module.exports = { networks };
