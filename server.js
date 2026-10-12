const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Servir la página web del formulario (index.html)
app.use(express.static(path.join(__dirname, 'public')));

// URL base de tu tenant de C4C (obtenida de tu enlace)
const C4C_HOST = process.env.C4C_HOST || 'https://my340670.crm.ondemand.com';
const C4C_USER = process.env.C4C_USER;
const C4C_PASS = process.env.C4C_PASS;

app.post('/api/crear-visita', async (req, res) => {
  try {
    if (!C4C_USER || !C4C_PASS) {
      return res.status(500).json({ exito: false, error: 'Faltan credenciales C4C_USER o C4C_PASS en el servidor.' });
    }

    const C4C_AUTH = Buffer.from(`${C4C_USER}:${C4C_PASS}`).toString('base64');
    const odataEndpoint = `${C4C_HOST}/sap/c4c/odata/v1/c4codataapi/AppointmentCollection`;

    // 1. Obtener el x-csrf-token
    const tokenResponse = await axios.get(odataEndpoint, {
      headers: {
        'Authorization': `Basic ${C4C_AUTH}`,
        'x-csrf-token': 'fetch'
      }
    });

    const csrfToken = tokenResponse.headers['x-csrf-token'];
    const cookies = tokenResponse.headers['set-cookie'];

    // 2. Enviar el registro POST a C4C
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