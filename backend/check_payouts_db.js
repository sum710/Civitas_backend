require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch');

async function getOpenAPI() {
    const url = process.env.SUPABASE_URL + '/rest/v1/?apikey=' + process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetch(url, {
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY
        }
    });
    
    const swagger = await response.json();
    fs.writeFileSync('payouts_schema.txt', JSON.stringify(Object.keys(swagger.definitions.payouts.properties)));
}

getOpenAPI();
