#!/bin/bash

if [[ $(sed -n '/^#!\/usr\/bin\/env/p;q' node_modules/.bin/algob) ]]
then
    echo "✅ Algob shebang already on bin"
else
    bin=`cat node_modules/.bin/algob`
    echo "#!/usr/bin/env node" > node_modules/.bin/algob;
    echo "$bin" >> node_modules/.bin/algob
    echo "💉 Patched algob bin with shebang #!/usr/bin/env node"
fi