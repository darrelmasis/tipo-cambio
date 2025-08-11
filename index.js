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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                      'Chrome/114.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Referer': 'https://www.bcn.gob.ni/IRR/tipo_cambio_mensual/index.php',
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

    if (dia > filasDatos.length) {
      console.error(`Día fuera de rango: ${dia} > ${filasDatos.length}`);
      return res.status(400).json({ error: `Día fuera de rango. La tabla tiene ${filasDatos.length} días.` });
    }

    const fila = filasDatos.eq(dia - 1);
    const columnas = fila.find('td');

    if (columnas.length < 2) {
      console.error('Formato inesperado: menos de 2 columnas en la fila');
      return res.status(500).json({ error: 'Formato de tabla inesperado.' });
    }

    const tipoCambio = columnas.eq(1).text().trim();

    console.log(`Tipo de cambio extraído para día ${dia}: ${tipoCambio}`);

    return res.json({
      fecha: `${anio}-${mesStr}-${dia.toString().padStart(2, '0')}`,
      tipo_cambio: tipoCambio
    });

  } catch (error) {
    console.error('Error en try catch:', error);
    return res.status(500).json({ error: 'Error al obtener tipo de cambio.' });
  }
});

// Exporta la app para Vercel
module.exports = app;