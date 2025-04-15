import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

interface SolicitudProps {
  codification: string;
  title: string;
  projectTitle: string;
  firstName: string;
  middleName: string;
  firstSurname: string;
  secondSurname: string; 
  identificationType: string;
  identificationNumber: string;
  vinculationType: string;
  externalInstitution?: string;
  level: string;
  risk: string;
  currentDate?: Date;
}

export async function generateSolicitudPDF(props: SolicitudProps): Promise<Uint8Array> {
  const {
    codification,
    title,
    projectTitle,
    firstName,
    middleName,
    firstSurname,
    secondSurname,
    identificationType,
    identificationNumber,
    vinculationType,
    externalInstitution,
    level,
    risk,
    currentDate = new Date()
  } = props;

  // Format the date in Spanish
  const day = currentDate.getDate();
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  const formattedDate = `${day} de ${month} de ${year}`;

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a page to the document
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  // Load fonts
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  
  // Load and embed the ESPOL header image
  try {
    // Load the header image from the public directory
    const headerImagePath = path.join(process.cwd(), 'public', 'images', 'espol-header.png');
    const headerImageBytes = await fs.readFile(headerImagePath);
    
    // Embed the image in the PDF
    const headerImage = await pdfDoc.embedPng(headerImageBytes);
    
    // Calculate the dimensions to maintain aspect ratio
    // The original image dimensions are used to scale properly
    const { width: imgWidth, height: imgHeight } = headerImage.size();
    
    // Calculate dimensions to fit within a reasonable width of the page
    const maxWidth = width - 120; // 60px margin on each side
    const scaleFactor = maxWidth / imgWidth;
    const scaledWidth = imgWidth * scaleFactor;
    const scaledHeight = imgHeight * scaleFactor;
    
    // Draw the image centered at the top of the page
    page.drawImage(headerImage, {
      x: (width - scaledWidth) / 2,
      y: height - scaledHeight - 40, // 40px top margin
      width: scaledWidth,
      height: scaledHeight,
    });
    
   
  } catch (error) {
    console.error('Error including header image:', error);
    
    // Fallback to text header if image fails to load
    // Draw ESPOL text on the left
    page.drawText('espol', {
      x: 60,
      y: height - 60,
      size: 17,
      font: timesBoldFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw Escuela Superior Politécnica del Litoral text
    page.drawText('Escuela Superior Politécnica del Litoral', {
      x: 125,
      y: height - 55,
      size: 13,
      font: timesBoldFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw address on right
    page.drawText('Guayaquil - Ecuador', {
      x: 400,
      y: height - 55,
      size: 13,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw additional address information
    page.drawText('Campus Gustavo Galindo Velasco - Km. 30.5 Via Perimetral - Pbx: (593-4) 2269 269', {
      x: 125,
      y: height - 75,
      size: 10,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw horizontal line below header
    page.drawLine({
      start: { x: 60, y: height - 90 },
      end: { x: width - 60, y: height - 90 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
  }

  // Title - position will adjust based on whether image or text header was used
  const titleY = page.getHeight() - (height > 800 ? 100 : 80); // Adjust position if needed
  
  // Center the document title
  const titleText = 'SOLICITUD DE ANÁLISIS DE PROPUESTAS DE INVESTIGACIÓN';
  const titleWidth = timesBoldFont.widthOfTextAtSize(titleText, 14);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2, // Center horizontally
    y: titleY,
    size: 14,
    font: timesBoldFont,
    color: rgb(0, 0, 0),
  });
  
  // Introduction paragraph with proper title/name handling
  let titlePrefix = title || ''; // Use title from metadata if available
  
  const fullName = `${firstName} ${middleName} ${firstSurname} ${secondSurname}`.trim();
  const vinculationText = vinculationType === 'INVESTIGADOR EXTERNO' || vinculationType === 'external' 
    ? `${externalInstitution} como INVESTIGADOR EXTERNO` 
    : vinculationType;
  
  // Create the formatted intro text exactly as requested - using the day, month, year variables declared above
  const introText = `En Guayaquil, a ${day} del mes de ${month} de ${year}, la/el ${titlePrefix} investigador/a ${fullName}, con ${identificationType} con numero ${identificationNumber} vinculado profesionalmente a ${vinculationText}, solicita al Comité de Ética en Investigación de ESPOL tenga a bien realizar un análisis metodológico, ético y jurídico del siguiente protocolo de investigación:`;
  
  // Draw justified intro text
  let yPosition = height - 130;
  yPosition = drawJustifiedText(
    page, 
    introText, 
    60, 
    yPosition, 
    480, 
    13, 
    timesRomanFont, 
    rgb(0, 0, 0),
    14
  );
  
  // Project title - centered and wrapped if necessary
  yPosition -= 13; // Aumentado en 3 puntos
  
  // Break project title into lines if it's too long
  const maxTitleWidth = 480; // Same width as paragraphs
  
  // Format the title but with bold font
  const titleLines = formatTextToWidth(projectTitle, maxTitleWidth, 13, timesBoldFont);
  
  // Draw each line of the title centered
  for (const line of titleLines) {
    const lineWidth = timesBoldFont.widthOfTextAtSize(line, 13);
    page.drawText(line, {
      x: (width - lineWidth) / 2, // Center horizontally
      y: yPosition,
      size: 13,
      font: timesBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15; // Move down for next line
  }
  
  // Main content paragraphs
  // If there were multiple lines in the project title, we don't need as much space
  yPosition -= 13; // Aumentado en 3 puntos
  
  const paragraph1 = "Esta consulta realizada al Comité de Ética en Investigación tiene la finalidad de obtener, la aprobación de un proyecto o protocolo de investigación, solo en sus aspectos metodológicos, éticos y jurídicos.";
  yPosition = drawJustifiedText(
    page, 
    paragraph1, 
    60, 
    yPosition, 
    480, 
    13, 
    timesRomanFont, 
    rgb(0, 0, 0),
    14
  );
  
  yPosition -= 13; // Aumentado en 3 puntos
  
  const paragraph2 = "A los efectos de informar al comité y cumplir con los artículos 1; 3; 36 y 42 del Reglamento General del Comité de Ética en Investigación de 2022, y con Código Orgánico de la Economía Social de los conocimientos de 2016, en concreto artículo 3 y artículo 4 incisos 12 y 13, declaro que en el desarrollo de esta investigación es " + level + " que se puedan producir daños físicos a Personas (psíquico), animales, plantas y medio ambiente. Porque esta investigación está en " + risk + " en función de los lineamientos dentro del Reglamento del CEI ESPOL.";
  yPosition = drawJustifiedText(
    page, 
    paragraph2, 
    60, 
    yPosition, 
    480, 
    13, 
    timesRomanFont, 
    rgb(0, 0, 0),
    14
  );
  
  yPosition -= 13; // Aumentado en 3 puntos
  
  const paragraph3 = "Del mismo modo declaro que en el desarrollo de esta investigación es " + level + " que se puedan producir daños a derechos de las Personas y sus datos personales porque esta investigación está en " + risk + " en función como se contempla en los artículos 40; 41 y 42 de la Ley Orgánica de Protección de Datos Personales de las personas participantes del proyecto de investigación o trabajos de investigación.";
  yPosition = drawJustifiedText(
    page, 
    paragraph3, 
    60, 
    yPosition, 
    480, 
    13, 
    timesRomanFont, 
    rgb(0, 0, 0),
    14
  );
  
  yPosition -= 13; // Aumentado en 3 puntos
  
  const paragraph4 = "Por medio de las presentes declaraciones de evaluación de riesgos, mi equipo y yo estamos dispuestos a presentar un PLAN DE CONTINGENCIA, en caso que sea solicitado por este comité. Comprendiendo que, sin el cumplimiento de este requisito, el comité podrá rechazar la solicitud de aval ético o no otorgar dicho aval al proyecto o protocolo de investigación.";
  yPosition = drawJustifiedText(
    page, 
    paragraph4, 
    60, 
    yPosition, 
    480, 
    13, 
    timesRomanFont, 
    rgb(0, 0, 0),
    14
  );
  
  // Signature
  yPosition -= 50;
  
  page.drawText("Firma del Solicitante", {
    x: 60,
    y: yPosition,
    size: 11,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Codification at the bottom
  page.drawText(codification, {
    x: 60,
    y: 50,
    size: 10,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Page number
  page.drawText("1", {
    x: width - 60,
    y: 50,
    size: 10,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Serialize the PDF to bytes
  return pdfDoc.save();
}

// Helper function to format text to fit a specified width (left-aligned)
function formatTextToWidth(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: any
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// New helper function to format justified text
// Instead of returning strings, we return an array of word positions
// that can be used to draw each word with precise spacing
function formatJustifiedTextToWidth(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: any
): { lines: string[], wordPositions?: { word: string, x: number }[][] } {
  // First, get normal lines of text
  const words = text.split(' ');
  const lines: string[] = [];
  const lineWords: string[][] = [];
  let currentLine: string[] = [];
  let currentLineText = '';
  
  // Break text into lines
  for (const word of words) {
    const testLine = currentLineText ? `${currentLineText} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    
    if (testWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLineText);
      lineWords.push([...currentLine]);
      currentLine = [word];
      currentLineText = word;
    } else {
      currentLine.push(word);
      currentLineText = testLine;
    }
  }
  
  // Add the last line
  if (currentLineText) {
    lines.push(currentLineText);
    lineWords.push([...currentLine]);
  }
  
  // Calculate word positions for justified text
  const wordPositions: { word: string, x: number }[][] = [];
  
  for (let i = 0; i < lineWords.length; i++) {
    const wordsInLine = lineWords[i];
    const line = lines[i];
    const lineWidth = font.widthOfTextAtSize(line, fontSize);
    const isLastLine = i === lineWords.length - 1;
    const hasEnoughWords = wordsInLine.length >= 3;
    
    // Don't justify the last line or lines with very few words
    if (isLastLine || !hasEnoughWords) {
      // For non-justified lines, just add regular spacing
      const positions: { word: string, x: number }[] = [];
      let xPos = 0;
      
      for (const word of wordsInLine) {
        positions.push({ word, x: xPos });
        xPos += font.widthOfTextAtSize(word + ' ', fontSize);
      }
      
      wordPositions.push(positions);
      continue;
    }
    
    // Calculate justification
    const extraSpace = maxWidth - lineWidth;
    const spacesCount = wordsInLine.length - 1;
    const extraSpacePerGap = extraSpace / spacesCount;
    
    // Calculate position for each word in the justified line
    const positions: { word: string, x: number }[] = [];
    let xPos = 0;
    
    for (let j = 0; j < wordsInLine.length; j++) {
      const word = wordsInLine[j];
      positions.push({ word, x: xPos });
      
      // Only add extra space if this isn't the last word
      if (j < wordsInLine.length - 1) {
        const normalSpace = font.widthOfTextAtSize(' ', fontSize);
        const justifiedSpace = normalSpace + extraSpacePerGap;
        xPos += font.widthOfTextAtSize(word, fontSize) + justifiedSpace;
      }
    }
    
    wordPositions.push(positions);
  }
  
  return { lines, wordPositions };
}

// Function to draw justified text on the page
function drawJustifiedText(
  page: any,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  font: any,
  color: any,
  lineHeight: number = 14
): number {
  // Reducimos el tamaño de fuente para coincidir con el otro documento
  fontSize = fontSize < 13 && fontSize > 10 ? 13 : fontSize;
  const lines = formatTextToWidth(text, width, fontSize, font);
  let yPosition = y;
  
  // Draw each line
  for (const line of lines) {
    // Justificar el texto distribuyendo espacios uniformemente
    if (line.trim() !== '') {
      const words = line.split(' ');
      const textWidth = font.widthOfTextAtSize(line, fontSize);
      const availableWidth = width;
      
      // Determinar si es la última línea del párrafo
      // Asumimos que es la última línea si ocupa menos del 85% del ancho disponible
      const isLastLine = textWidth < (availableWidth * 0.85);
      
      // Si es la última línea del párrafo o la línea no tiene espacios, no justificar
      if (words.length <= 1 || isLastLine) {
        page.drawText(line, {
          x: x,
          y: yPosition,
          size: fontSize,
          font: font,
          color: color,
        });
      } else {
        // Calcular espacios para justificación
        const normalSpaceWidth = font.widthOfTextAtSize(' ', fontSize);
        const textWidthWithoutSpaces = words.reduce((acc, word) => acc + font.widthOfTextAtSize(word, fontSize), 0);
        const totalSpacesWidth = availableWidth - textWidthWithoutSpaces;
        const spaceWidth = words.length > 1 ? totalSpacesWidth / (words.length - 1) : normalSpaceWidth;
        
        // Limitar el espacio máximo a 3 veces el espacio normal para evitar espacios excesivos
        const limitedSpaceWidth = Math.min(spaceWidth, normalSpaceWidth * 3);
        
        // Dibujar cada palabra con espacio calculado
        let xPos = x;
        for (let i = 0; i < words.length; i++) {
          page.drawText(words[i], {
            x: xPos,
            y: yPosition,
            size: fontSize,
            font: font,
            color: color,
          });
          
          // Avanzar posición X para la siguiente palabra
          if (i < words.length - 1) {
            xPos += font.widthOfTextAtSize(words[i], fontSize) + limitedSpaceWidth;
          }
        }
      }
    }
    
    yPosition -= lineHeight;
  }
  
  return yPosition; // Return the new Y position
}