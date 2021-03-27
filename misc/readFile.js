const fs = require('fs');

const readFile = async(file_path) => {

    return new Promise(function(resolve, reject) {

        fs.readFile(file_path, (err, data) => {
            if (err) reject();
            const file_data = JSON.parse(data);

            resolve(file_data);
        });

    });

}

module.exports = readFile;