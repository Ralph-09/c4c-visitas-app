const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

// Obtener host de C4C limpiando espacios y asegurando https://
let host = (process.env.C4C_HOST || 'https://my340670.crm.ondemand.com').trim();
if (!host.startsWith('http://') && !host.startsWith('https://')) {
  host = `https://${host}`;
}
const C4C_HOST = host.replace(/\/+$/, ''); // Remueve diagonales al final si las hay

const C4C_USER = process.env.C4C_USER ? process.env.C4C_USER.trim() : '';
const C4C_PASS = process.env.C4C_PASS ? process.env.C4C_PASS.trim() : '';

app.post('/api/crear-visita', async (req, res) => {
  try {
    if (!C4C_USER || !C4C_PASS) {
      return res.status(500).json({ exito: false, error: 'Faltan credenciales C4C_USER o C4C_PASS en Render.' });
    }

    const C4C_AUTH = Buffer.from(`${C4C_USER}:${C4C_PASS}`).toString('base64');
    const odataEndpoint = `${C4C_HOST}/sap/c4c/odata/v1/c4codataapi/AppointmentCollection`;

    console.log(`Conectando a C4C en: ${odataEndpoint}`);

    // 1. Obtener x-csrf-token
    const tokenResponse = await axios.get(odataEndpoint, {
      headers: {
        'Authorization': `Basic ${C4C_AUTH}`,
        'x-csrf-token': 'fetch'
      }
    });

    const csrfToken = tokenResponse.headers['x-csrf-token'];
    const cookies = tokenResponse.headers['set-cookie'];

    // 2. Crear visita en C4C
    const postResponse = await axios.post(odataEndpoint, req.body, {
      headers: {
        'Authorization': `Basic ${C4C_AUTH}`,
        'x-csrf-token': csrfToken,
        'Content-Type': 'application/json',
        'Cookie': cookies ? cookies.join('; ') : ''
      }
    });

    res.status(200).json({ 
      exito: true, 
      mensaje: 'Visita creada correctamente en C4C',
      data: postResponse.data 
    });

  } catch (error) {
    console.error('Error C4C:', error.response?.data || error.message);
    res.status(500).json({ 
      exito: false, 
      error: 'Error de comunicación con SAP C4C', 
      detalle: error.response?.data?.error?.message?.value || error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor iniciado en puerto ${PORT}`));