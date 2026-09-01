require('dotenv').config({ path: './.env' });
const axios = require('axios');

async function testChapaEmails() {
    const emailsToTest = [
        'customer@gondarsuk.com',
        'customer@example.com',
        'tahir@gmail.com',
        'test12345@yahoo.com',
        'gondarsuk@gmail.com'
    ];

    for (const email of emailsToTest) {
        const tx_ref = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const data = {
            amount: 10,
            currency: 'ETB',
            email: email,
            first_name: 'Test',
            last_name: 'User',
            phone_number: '0911223344',
            tx_ref: tx_ref,
            callback_url: 'http://localhost/callback',
            return_url: 'http://localhost/return',
            customization: {
                title: 'Gondar Store',
                description: 'Payment for order',
            },
        };

        try {
            console.log(`\nTesting email: ${email}`);
            const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', data, {
                headers: {
                    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                },
            });
            console.log('✅ Success! Response:', response.data.message);
        } catch (error) {
            console.log('❌ Failed. Error:', error.response?.data?.message || error.message);
        }
    }
}

testChapaEmails();
