const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { ensureDirectory } = require('../utils/file-handler');

/**
 * Servicio para generación de PDFs
 */

/**
 * Agrega el membrete Click Vital al PDF
 * @param {PDFDocument} doc - Documento PDF
 * @returns {number} - Posición Y donde debe iniciar el contenido
 */
const agregarMembreteClickVital = (doc) => {
  const membretePath = path.join(__dirname, '../public/membrete.jpg');
  
  try {
    // Verificar si existe el membrete
    if (fs.existsSync(membretePath)) {
      // Agregar membrete en la parte superior
      // Tamaño ajustado para que ocupe el ancho completo pero altura limitada
      doc.image(membretePath, 0, 0, { 
        width: 612, // Ancho completo de página Letter
        height: 90   // Altura del membrete
      });
      
      // Retornar posición Y donde debe empezar el contenido
      return 100;
    } else {
      console.warn('⚠️ Membrete no encontrado, continuando sin membrete');
      return 20;
    }
  } catch (error) {
    console.error('❌ Error al cargar membrete:', error);
    return 20;
  }
};

/**
 * Genera PDF de evaluación de riesgo cardiovascular
 * @param {Object} evaluacion - Objeto completo de evaluación con resultado
 * @param {Object} pacienteData - Datos completos del paciente (opcional)
 * @returns {Promise<string>} - Ruta relativa del PDF generado
 */
const generarPDFRiesgoCardiovascular = async (evaluacion, pacienteData = null) => {
  const pdfDir = path.join(__dirname, '../pdfs/evaluaciones');
  await ensureDirectory(pdfDir);

  const filename = `${evaluacion.id}.pdf`;
  const pdfPath = path.join(pdfDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const stream = fs.createWriteStream(pdfPath);

      doc.pipe(stream);

      // ==================== MEMBRETE ====================
      const startY = agregarMembreteClickVital(doc);
      doc.y = startY;

      // ==================== HEADER ====================
      doc.fontSize(18).font('Helvetica-Bold')
        .text('EVALUACIÓN DE RIESGO CARDIOVASCULAR', { align: 'center' });
      
      doc.fontSize(11).font('Helvetica')
        .text('Método PAHO/OPS - Organización Panamericana de la Salud', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(9)
        .text(`Fecha: ${new Date(evaluacion.fecha).toLocaleString('es-CO')} | ID: ${evaluacion.id}`, { align: 'right' });

      doc.moveDown(1);

      // ==================== INFORMACIÓN DEL PACIENTE ====================
      doc.fontSize(14).font('Helvetica-Bold')
        .text('DATOS DEL PACIENTE');
      
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');

      if (pacienteData) {
        // Calcular edad desde fecha de nacimiento
        let edadTexto = '';
        if (pacienteData.fecha_nacimiento) {
          const fechaNac = new Date(pacienteData.fecha_nacimiento);
          const hoy = new Date();
          let edad = hoy.getFullYear() - fechaNac.getFullYear();
          const mes = hoy.getMonth() - fechaNac.getMonth();
          if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
          }
          const fechaNacFormato = fechaNac.toLocaleDateString('es-CO');
          edadTexto = ` (${edad} años)`;
          
          doc.text(`Nombre: ${pacienteData.nombre} ${pacienteData.apellidos}`);
          doc.text(`Documento: ${pacienteData.tipo_documento} Nro. ${pacienteData.numero_documento}`);
          doc.text(`Fecha de Nacimiento: ${fechaNacFormato}${edadTexto}`);
        } else {
          doc.text(`Nombre: ${pacienteData.nombre} ${pacienteData.apellidos}`);
          doc.text(`Documento: ${pacienteData.tipo_documento} Nro. ${pacienteData.numero_documento}`);
        }
        
        if (pacienteData.sexo) {
          const sexoFormato = pacienteData.sexo === 'hombre' ? 'Masculino' : 
                             pacienteData.sexo === 'mujer' ? 'Femenino' : 
                             pacienteData.sexo;
          doc.text(`Sexo: ${sexoFormato}`);
        }
        
        if (pacienteData.rh) {
          doc.text(`Tipo de Sangre (RH): ${pacienteData.rh}`);
        }
      } else {
        // Fallback si no hay datos del paciente
        doc.text(`Paciente ID: ${evaluacion.paciente_id}`, { continued: false });
        doc.fontSize(9).fillColor('#666666')
          .text(`(Datos completos no disponibles)`, { continued: false });
        doc.fillColor('#000000').fontSize(10);
      }

      doc.moveDown(1.5);

      // ==================== PARÁMETROS EVALUADOS ====================
      doc.fontSize(14).font('Helvetica-Bold')
        .text('PARÁMETROS EVALUADOS');
      
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(0.5);

      const datos = evaluacion.datos_entrada;
      doc.fontSize(10).font('Helvetica');

      // Datos demográficos
      doc.font('Helvetica-Bold').text('Datos Demográficos:', { underline: true });
      doc.font('Helvetica')
        .text(`  • Edad: ${datos.edad} años`)
        .text(`  • Sexo: ${datos.sexo === 'masculino' ? 'Masculino' : 'Femenino'}`);
      doc.moveDown(0.5);

      // Factores de riesgo
      doc.font('Helvetica-Bold').text('Factores de Riesgo:', { underline: true });
      doc.font('Helvetica')
        .text(`  • Fumador: ${datos.fumador ? 'Sí' : 'No'}`)
        .text(`  • Diabetes: ${datos.diabetes ? 'Sí' : 'No'}`)
        .text(`  • Hipertensión: ${datos.hipertension ? 'Sí' : 'No'}`);
      
      if (datos.cardiovascular) {
        doc.text(`  • Antecedente Cardiovascular: Sí`);
      }
      if (datos.renal) {
        doc.text(`  • Enfermedad Renal: Sí`);
      }
      doc.moveDown(0.5);

      // Signos vitales con fuente
      doc.font('Helvetica-Bold').text('Signos Vitales:', { underline: true });
      
      const sistolica = typeof datos.sistolica === 'object' ? datos.sistolica : { valor: datos.sistolica, fuente: 'manual' };
      const diastolica = typeof datos.diastolica === 'object' ? datos.diastolica : { valor: datos.diastolica, fuente: 'manual' };
      const frecuencia = datos.frecuencia ? (typeof datos.frecuencia === 'object' ? datos.frecuencia : { valor: datos.frecuencia, fuente: 'manual' }) : null;

      doc.font('Helvetica')
        .text(`  • Presión Arterial: ${sistolica.valor}/${diastolica.valor} mmHg`)
        .text(`    Fuente: ${sistolica.fuente || 'manual'}${sistolica.medicion_id ? ` (ID: ${sistolica.medicion_id})` : ''}`);
      
      if (frecuencia) {
        doc.text(`  • Frecuencia Cardíaca: ${frecuencia.valor} lpm`)
          .text(`    Fuente: ${frecuencia.fuente || 'manual'}${frecuencia.medicion_id ? ` (ID: ${frecuencia.medicion_id})` : ''}`);
      }

      if (datos.hba1c) {
        const hba1c = typeof datos.hba1c === 'object' ? datos.hba1c : { valor: datos.hba1c, fuente: 'manual' };
        doc.text(`  • HbA1c: ${hba1c.valor}%`)
          .text(`    Fuente: ${hba1c.fuente || 'manual'}`);
      }
      doc.moveDown(0.5);

      // Perfil lipídico o antropométricos
      if (datos.conoceColesterol) {
        doc.font('Helvetica-Bold').text('Perfil Lipídico:', { underline: true });
        const colesterolTotal = typeof datos.colesterolTotal === 'object' ? datos.colesterolTotal : { valor: datos.colesterolTotal, fuente: 'manual' };
        doc.font('Helvetica')
          .text(`  • Colesterol Total: ${colesterolTotal.valor} mg/dL`)
          .text(`    Fuente: ${colesterolTotal.fuente || 'manual'}`);
        
        if (datos.hdl) {
          const hdl = typeof datos.hdl === 'object' ? datos.hdl : { valor: datos.hdl, fuente: 'manual' };
          doc.text(`  • HDL: ${hdl.valor} mg/dL`)
            .text(`    Fuente: ${hdl.fuente || 'manual'}`);
        }
      } else {
        doc.font('Helvetica-Bold').text('Datos Antropométricos:', { underline: true });
        const peso = typeof datos.peso === 'object' ? datos.peso : { valor: datos.peso, fuente: 'manual' };
        const talla = typeof datos.talla === 'object' ? datos.talla : { valor: datos.talla, fuente: 'manual' };
        
        doc.font('Helvetica')
          .text(`  • Peso: ${peso.valor} kg`)
          .text(`    Fuente: ${peso.fuente || 'manual'}${peso.medicion_id ? ` (ID: ${peso.medicion_id})` : ''}`)
          .text(`  • Talla: ${talla.valor} cm`)
          .text(`    Fuente: ${talla.fuente || 'manual'}`);
        
        if (datos.imc) {
          doc.text(`  • IMC: ${datos.imc} kg/m²`);
        }
      }

      doc.moveDown(2);

      // ==================== RESULTADO ====================
      doc.fontSize(14).font('Helvetica-Bold')
        .text('RESULTADO DE LA EVALUACIÓN');
      
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(0.5);

      const resultado = evaluacion.resultado;

      // Color según categoría
      let colorCategoria, textoCategoria;
      switch (resultado.categoria) {
        case 'BAJO':
          colorCategoria = '#28a745'; // Verde
          textoCategoria = 'RIESGO BAJO';
          break;
        case 'MODERADO':
          colorCategoria = '#ffc107'; // Amarillo/Naranja
          textoCategoria = 'RIESGO MODERADO';
          break;
        case 'ALTO':
          colorCategoria = '#dc3545'; // Rojo
          textoCategoria = 'RIESGO ALTO';
          break;
        default:
          colorCategoria = '#6c757d';
          textoCategoria = resultado.categoria;
      }

      // Cuadro de resultado
      const boxY = doc.y;
      doc.rect(50, boxY, 512, 80)
        .fillAndStroke(colorCategoria, '#000000');
      
      doc.fillColor('#FFFFFF')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(textoCategoria, 50, boxY + 15, { width: 512, align: 'center' });
      
      doc.fontSize(14)
        .text(`Riesgo Cardiovascular: ${resultado.riesgo}`, 50, boxY + 45, { width: 512, align: 'center' });

      doc.fillColor('#000000');
      doc.moveDown(6);

      doc.fontSize(10).font('Helvetica')
        .text(`Puntuación PAHO: ${resultado.puntuacion} puntos`)
        .text(`Clasificación de Presión Arterial: ${resultado.clasificacionPA || 'N/A'}`);

      doc.moveDown(1.5);

      // ==================== RECOMENDACIONES ====================
      if (resultado.recomendaciones && resultado.recomendaciones.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold')
          .text('RECOMENDACIONES PERSONALIZADAS');
        
        doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown(0.5);

        doc.fontSize(10).font('Helvetica');
        resultado.recomendaciones.forEach((rec, index) => {
          doc.text(`${index + 1}. ${rec}`, { align: 'left', indent: 10 });
          doc.moveDown(0.3);
        });
      }

      // ==================== FOOTER ====================
      const pageHeight = doc.page.height;
      doc.fontSize(8).font('Helvetica')
        .text(
          `Documento generado el ${new Date().toLocaleString('es-CO')} | Sistema SoyBienmedico | Versión Algoritmo: ${evaluacion.version_algoritmo}`,
          50,
          pageHeight - 50,
          { align: 'center', width: 512 }
        );

      doc.end();

      stream.on('finish', () => {
        resolve(`/pdfs/evaluaciones/${filename}`);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Genera PDF de evaluación HADS
 * @param {Object} evaluacion - Objeto completo de evaluación con resultados
 * @param {Object} pacienteData - Datos del paciente
 * @returns {Promise<string>} - Ruta del PDF generado
 */
const generarPDFHADS = async (evaluacion, pacienteData) => {
  const pdfDir = path.join(__dirname, '../pdfs/evaluaciones');
  await ensureDirectory(pdfDir);

  const filename = `${evaluacion.id}.pdf`;
  const pdfPath = path.join(pdfDir, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const stream = fs.createWriteStream(pdfPath);

      doc.pipe(stream);

      // ==================== MEMBRETE ====================
      const startY = agregarMembreteClickVital(doc);
      doc.y = startY;

      // ==================== HEADER ====================
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#8e44ad')
        .text('EVALUACIÓN PSICOLÓGICA', { align: 'center' });
      
      doc.fontSize(12).font('Helvetica').fillColor('#000000')
        .text('Escala HADS (Ansiedad y Depresión) + Burnout Laboral', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fontSize(9)
        .text(`Fecha: ${new Date(evaluacion.fecha).toLocaleString('es-CO')} | ID: ${evaluacion.id}`, { align: 'right' });

      doc.moveDown(1);

      // ==================== INFORMACIÓN DEL PACIENTE ====================
      doc.fontSize(13).font('Helvetica-Bold')
        .text('DATOS DEL PACIENTE');
      
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');

      if (pacienteData) {
        // Calcular edad
        let edadTexto = '';
        if (pacienteData.fecha_nacimiento) {
          const fechaNac = new Date(pacienteData.fecha_nacimiento);
          const hoy = new Date();
          let edad = hoy.getFullYear() - fechaNac.getFullYear();
          const mes = hoy.getMonth() - fechaNac.getMonth();
          if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
            edad--;
          }
          edadTexto = ` (${edad} años)`;
        }
        
        doc.text(`Nombre: ${pacienteData.nombre} ${pacienteData.apellidos}`);
        doc.text(`Documento: ${pacienteData.tipo_documento} Nro. ${pacienteData.numero_documento}`);
        if (edadTexto) {
          doc.text(`Edad: ${edadTexto.substring(2, edadTexto.length - 1)}`);
        }
        if (pacienteData.ocupacion) {
          doc.text(`Ocupación: ${pacienteData.ocupacion}`);
        }
      } else {
        doc.text(`Paciente ID: ${evaluacion.paciente_id}`);
      }

      doc.moveDown(1.5);

      // ==================== RESULTADOS ====================
      const resultados = evaluacion.resultado;

      // Función helper para agregar resultado individual
      const agregarResultado = (titulo, resultado, color) => {
        // Verificar si necesitamos nueva página
        if (doc.y > 650) {
          doc.addPage();
          doc.y = agregarMembreteClickVital(doc);
        }

        doc.fontSize(12).font('Helvetica-Bold').fillColor(color)
          .text(titulo.toUpperCase(), { underline: true });
        
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica').fillColor('#000000');

        const puntuacion = resultado.puntuacion || resultado.promedio || resultado.puntuacionFormateada || 0;
        const maxPuntuacion = resultado.maxPuntuacion || '';
        const categoria = resultado.categoria || 'N/A';
        const descripcion = resultado.descripcion || '';

        doc.text(`Puntuación: ${puntuacion}${maxPuntuacion ? '/' + maxPuntuacion : ''}`);
        
        // Categoría con color de fondo
        let categoriaColor;
        switch (resultado.clase || categoria.toLowerCase()) {
          case 'grave':
          case 'alto':
            categoriaColor = '#dc3545';
            break;
          case 'moderado':
          case 'medio':
            categoriaColor = '#ffc107';
            break;
          case 'leve':
            categoriaColor = '#fd7e14';
            break;
          default:
            categoriaColor = '#28a745';
        }

        const boxY = doc.y;
        doc.rect(50, boxY, 200, 20)
          .fillAndStroke(categoriaColor, '#000000');
        
        doc.fillColor('#FFFFFF')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text(categoria, 50, boxY + 5, { width: 200, align: 'center' });

        doc.fillColor('#000000');
        doc.y = boxY + 25;

        doc.fontSize(9).font('Helvetica')
          .text(descripcion, { width: 512, align: 'justify' });

        doc.moveDown(1);
      };

      // Resultados de Ansiedad
      if (resultados.ansiedad) {
        agregarResultado('Ansiedad HADS', resultados.ansiedad, '#e74c3c');
      }

      // Resultados de Depresión
      if (resultados.depresion) {
        agregarResultado('Depresión HADS', resultados.depresion, '#3498db');
      }

      // Resultados de Burnout
      if (resultados.burnout) {
        agregarResultado('Burnout Laboral', resultados.burnout, '#e67e22');
      }

      doc.moveDown(1);

      // ==================== RECOMENDACIONES ====================
      if (resultados.recomendaciones && resultados.recomendaciones.length > 0) {
        // Verificar espacio para recomendaciones
        if (doc.y > 600) {
          doc.addPage();
          doc.y = agregarMembreteClickVital(doc);
        }

        doc.fontSize(13).font('Helvetica-Bold')
          .text('RECOMENDACIONES GENERALES');
        
        doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
        doc.moveDown(0.5);

        doc.fontSize(9).font('Helvetica');
        resultados.recomendaciones.slice(0, 8).forEach((rec, index) => {
          doc.text(`${index + 1}. ${rec}`, { indent: 10 });
          doc.moveDown(0.2);
        });
      }

      // ==================== FOOTER ====================
      const pageHeight = doc.page.height;
      doc.fontSize(8).font('Helvetica').fillColor('#666666')
        .text(
          `Documento generado el ${new Date().toLocaleString('es-CO')} | Sistema SoyBienmedico`,
          50,
          pageHeight - 50,
          { align: 'center', width: 512 }
        );

      doc.end();

      stream.on('finish', () => {
        console.log(`✅ PDF HADS generado: ${filename}`);
        resolve(`/pdfs/evaluaciones/${filename}`);
      });

      stream.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      console.error('❌ Error generando PDF HADS:', error);
      reject(error);
    }
  });
};

/**
 * Genera PDF de historia clínica
 * @param {Object} historiaData - Datos de la historia clínica
 * @param {Object} pacienteData - Datos del paciente
 * @param {Object} medicoData - Datos del médico
 * @returns {Promise<string>} - Ruta del PDF generado
 */
const generarPDFHistoriaClinica = async (historiaData, pacienteData, medicoData) => {
  // TODO: Implementar generación real de PDF
  const pdfDir = path.join(__dirname, '../uploads/historias-clinicas');
  await ensureDirectory(pdfDir);

  const filename = `HC_${pacienteData.numero_documento}_${Date.now()}.pdf`;
  const pdfPath = path.join(pdfDir, filename);

  // Aquí se implementará la generación del PDF con firma digital del médico

  return `/uploads/historias-clinicas/${filename}`;
};

module.exports = {
  generarPDFRiesgoCardiovascular,
  generarPDFHADS,
  generarPDFHistoriaClinica
};
