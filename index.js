const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

app.get('/api/cambio', async (req, res) => {
  try {
    let { dia, mes, anio } = req.query;
    const fecha = new Date();

    dia = Number.isInteger(+dia) && +dia > 0 ? +dia : fecha.getDate();
    mes = Number.isInteger(+mes) && +mes > 0 ? +mes : fecha.getMonth() + 1;
    anio = Number.isInteger(+anio) && +anio > 0 ? +anio : fecha.getFullYear();

    const mesStr = mes.toString().padStart(2, '0');
    const url = `https://www.bcn.gob.ni/IRR/tipo_cambio_mensual/mes.php?mes=${mesStr}&anio=${anio}`;

    console.log(`Consultando URL: ${url}`);

    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://www.bcn.gob.ni/IRR/tipo_cambio_mensual/index.php',
      }
    });

    const $ = cheerio.load(data);
    const tabla = $('table').first();

    if (!tabla || tabla.length === 0) {
      return res.status(404).send('No se encontró la tabla.');
    }

    // Construir CSV
    let csv = 'Fecha,Tipo de Cambio\n';
    tabla.find('tr').each((i, tr) => {
      const tds = $(tr).find('td');
      if (tds.length >= 2) {
        const fecha = $(tds[0]).text().trim();
        const tipoCambio = $(tds[1]).text().trim();
        csv += `${fecha},${tipoCambio}\n`;
      }
    });

    // Enviar CSV directamente
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=TipoCambio.csv');
    res.send(csv);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error al obtener tipo de cambio.');
  }
});

module.exports = app;
