const fs = require('node:fs');

module.exports = {
    addressesFor: (postfixMasterFile) => {
        const file = `./addresses.${postfixMasterFile}.js`;
        return fs.existsSync(file) ? require(file) : {};
    }
}