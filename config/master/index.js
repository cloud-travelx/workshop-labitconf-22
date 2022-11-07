const {mkAccounts} = require("@algo-builder/algob");

module.exports = {
    masterFor: (postfixMasterFile) => {
        const {addr, mnemonic} = require(`./master.${postfixMasterFile}.js`);
        return mkAccounts([{name: 'master', addr, mnemonic}]);
    }
}