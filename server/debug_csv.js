const csv = require('csv-parser');
const fs = require('fs');

const results = [];
fs.createReadStream('test.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
        console.log('Parsed Rows:', results.length);
        if (results.length > 0) {
            console.log('First Row Keys:', Object.keys(results[0]));
            console.log('First Row:', results[0]);

            const row = results[0];
            const normalizedRow = {};
            for (const key in row) {
                normalizedRow[key.toLowerCase().trim()] = row[key];
            }
            console.log('Normalized Keys:', Object.keys(normalizedRow));

            const phone = normalizedRow['personalization.sessionstate.phone'];
            console.log('Detected Phone:', phone);
        }
    });
