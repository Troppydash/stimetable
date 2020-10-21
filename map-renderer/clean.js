const fs = require("fs");
fs.rmdir("./lib", { recursive: true }, (err) => {
    if (err) {
        console.error(err);
    }
});

console.log('Done');
