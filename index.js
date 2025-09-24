const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

app.get('/api/cambio', async (req, res) => {
  try {
    const { fecha_inicial = '2018-01-01', fecha_final = new Date().toISOString().slice(0,10) } = req.query;

    const url = `https://www.bcn.gob.ni/IRR/tipo_cambio_mensual/mes.php?Fecha_inicial=${fecha_inicial}&Fecha_final=${fecha_final}`;
    console.log(`Consultando URL: ${url}`);

    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                      'Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      }
    });

    const $ = cheerio.load(data);
    const tabla = $('table').first();

    if (!tabla || tabla.length === 0) {
      console.error('No se encontró tabla en el HTML.');
      return res.status(404).json({ error: 'No se encontró la tabla.' });
    }

    const filas = tabla.find('tr');
    const filasDatos = filas.filter((i, el) => $(el).find('td').length > 0);

    const resultados = filasDatos.map((i, el) => {
      const columnas = $(el).find('td');
      const fecha = columnas.eq(0).text().trim();
      const tipoCambio = columnas.eq(1).text().trim();
      return { fecha, tipo_cambio: tipoCambio };
    }).get();

    return res.json({ fecha_inicial, fecha_final, datos: resultados });

  } catch (error) {
    console.error('Error al obtener datos:', error);
    return res.status(500).json({ error: 'Error al obtener tipo de cambio.' });
  }
});

// Exporta la app para Vercel
module.exports = app;
