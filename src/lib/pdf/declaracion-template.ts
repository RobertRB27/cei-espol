import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

interface DeclaracionProps {
  codification: string;
  title: string;
  firstName: string;
  middleName: string;
  firstSurname: string;
  secondSurname: string; 
  identificationType: string;
  identificationNumber: string;
  vinculationType: string;
  externalInstitution?: string;
  currentDate?: Date;
}

export async function generateDeclaracionPDF(props: DeclaracionProps): Promise<Uint8Array> {
  const {
    codification,
    title,
    firstName,
    middleName,
    firstSurname,
    secondSurname,
    identificationType,
    identificationNumber,
    vinculationType,
    externalInstitution,
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
    page.drawText('ESPOL', {
      x: 60,
      y: height - 60,
      size: 17,
      font: timesBoldFont,
      color: rgb(0, 0, 0),
    });
  }

  // Title - position will adjust based on whether image or text header was used
  const titleY = page.getHeight() - (height > 800 ? 100 : 80); // Adjust position if needed
  
  // Center the document title
  const titleText = 'DECLARACIÓN DE ASUNCIÓN DE RESPONSABILIDAD PARA EL USO ADECUADO DE LA INFORMACIÓN DE CARÁCTER CONFIDENCIAL';
  
  // Handle wrapping of the long title
  const maxTitleWidth = 480;
  const titleLines = formatTextToWidth(titleText, maxTitleWidth, 15, timesBoldFont);
  
  // Draw each line of the title centered
  let yPosition = titleY;
  for (const line of titleLines) {
    const lineWidth = timesBoldFont.widthOfTextAtSize(line, 14);
    page.drawText(line, {
      x: (width - lineWidth) / 2, // Center horizontally
      y: yPosition,
      size: 15,
      font: timesBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20; // More space between title lines
  }
  
  // Main content paragraphs
  yPosition -= 20; // Space after title
  
  // Header image path for multi-page support
  const headerImagePath = path.join(process.cwd(), 'public', 'images', 'espol-header.png');
  const footerImagePath = ''; // Footer removed as requested
  
  // Track current page and page number
  let currentPage = page;
  let currentPageNumber = 1;

  // Paragraph 1
  const paragraph1 = "Este documento tiene el objeto de obligar y asegurar la debida protección, conservación y buen uso de la información confidencial que se genere del presente estudio de investigación, por parte de los responsables abajo firmantes.";
  const result1 = drawJustifiedText(
    pdfDoc,
    currentPage, 
    paragraph1, 
    60, 
    yPosition, 
    480, 
    13, 
    timesRomanFont, 
    rgb(0, 0, 0),
    14,
    headerImagePath,
    footerImagePath,
    currentPageNumber
  );
  
  yPosition = result1.yPosition;
  currentPage = result1.page;
  currentPageNumber = result1.pageNumber;
  yPosition -= 15;
  
  // Paragraph 2
  const paragraph2 = "Es información confidencial según el artículo 66- 19 y 91 de la Constitución de la República del Ecuador, 2008, datos de personas colaboradores en la investigación, datos, o fórmulas, metodologías y especificaciones de productos y servicios que formen parte del estudio. Se aconseja observar también la Ley Orgánica de Protección de datos Personales, de 2021 y el Código Orgánico de la Economía Social de los Conocimientos de 2016, artículos 43, 67 inciso 5, 277, 523 y 530.";
  const result2 = drawJustifiedText(
    pdfDoc,
    currentPage, 
    paragraph2, 
    60, 
    yPosition, 
    480, 
    13, 
    timesRomanFont, 
    rgb(0, 0, 0),
    14,
    headerImagePath,
    footerImagePath,
    currentPageNumber
  );
  
  yPosition = result2.yPosition;
  currentPage = result2.page;
  currentPageNumber = result2.pageNumber;
  yPosition -= 15;
  
  // Paragraph 3
  const paragraph3 = "Resultados de análisis pruebas y proyecciones y nuevos proyectos, productos de software propiedad de las instituciones promotoras de la investigación con licencias de uso, independientemente del medio en que se encuentre la información (electrónica, impresa etc.) los miembros del equipo del presente estudio de investigación se conducirán según los siguientes principios:";
  const result3 = drawJustifiedText(
    pdfDoc,
    currentPage, 
    paragraph3, 
    60, 
    yPosition, 
    480, 
    13, 
    timesRomanFont, 
    rgb(0, 0, 0),
    14,
    headerImagePath,
    footerImagePath,
    currentPageNumber
  );
  
  yPosition = result3.yPosition;
  currentPage = result3.page;
  currentPageNumber = result3.pageNumber;
  yPosition -= 15;
  
  // List items
  const listItems = [
    "Generar mecanismo apropiados para el almacenamiento de información, con el objetivo de evitar su divulgación y mal uso.",
    "Cada una de las áreas de trabajo en las que se realiza la investigación habrá un responsable que habrá de tomar medidas para proteger la información teniendo en cuenta las clases de lugares de trabajo en las que se encuentra puede haber visitantes o personas ajenas al proyecto.",
    "Se podrá utilizar equipos de grabación como videos en cualquier fase de la misma, contando con la debía autorización tanto el equipo como los participantes.",
    "Patrocinar la información de la investigación solo cuando hay requerimiento expreso, fundado y motivado de los demás integrantes del proyecto.",
    "Está prohibido utilizar la información para la obtención de cualquier beneficio."
  ];
  
  for (let i = 0; i < listItems.length; i++) {
    // Check for page break before drawing the number
    const pageCheck = checkForNewPage(
      pdfDoc, 
      currentPage, 
      yPosition, 
      30,
      timesRomanFont,
      headerImagePath,
      footerImagePath,
      currentPageNumber
    );
    
    currentPage = pageCheck.page;
    yPosition = pageCheck.yPosition;
    currentPageNumber = pageCheck.pageNumber;
    
    // Draw the number
    currentPage.drawText(`${i+1}-`, {
      x: 70,
      y: yPosition,
      size: 11,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw the text with indentation
    const itemResult = drawJustifiedText(
      pdfDoc,
      currentPage, 
      listItems[i], 
      90, // Indented
      yPosition, 
      450, // Slightly narrower width due to indentation
      13, 
      timesRomanFont, 
      rgb(0, 0, 0),
      15, // Adjusted line height
      headerImagePath,
      footerImagePath,
      currentPageNumber
    );
    
    yPosition = itemResult.yPosition;
    currentPage = itemResult.page;
    currentPageNumber = itemResult.pageNumber;
    yPosition -= 11; // Extra space between list items
  }
  
  yPosition -= 15;
  
  // Paragraph after list
  const paragraph4 = "Todos los miembros del grupo son responsables de su buen uso y asumen las responsabilidades por su mal uso al ocasionar daños a las personas que participaron en el proyecto.";
  const result4 = drawJustifiedText(
    pdfDoc,
    currentPage, 
    paragraph4, 
    60, 
    yPosition, 
    480, 
    13, 
    timesRomanFont, 
    rgb(0, 0, 0),
    14,
    headerImagePath,
    footerImagePath,
    currentPageNumber
  );
  
  yPosition = result4.yPosition;
  currentPage = result4.page;
  currentPageNumber = result4.pageNumber;
  yPosition -= 15;
  
  // Final paragraph
  const paragraph5 = "Para poder hacer difusión pública de los resultados del proyecto de investigación se deben observar:";
  const result5 = drawJustifiedText(
    pdfDoc,
    currentPage, 
    paragraph5, 
    60, 
    yPosition, 
    480, 
    13, 
    timesRomanFont, 
    rgb(0, 0, 0),
    14,
    headerImagePath,
    footerImagePath,
    currentPageNumber
  );
  
  yPosition = result5.yPosition;
  currentPage = result5.page;
  currentPageNumber = result5.pageNumber;
  yPosition -= 15;
  
  // Second list
  const secondListItems = [
    "Cumplir con la normativa Internacional y nacional para la difusión de resultados de estudios científicos",
    "La difusión no debe incluir símbolos ofensivos, culturales, religioso, sexuales u otros, ni contener ideologías políticas, o que realice cualquier otro de carácter discriminatorio.",
    "Las difusiones de los resultados del Estudio deben incluir con carácter obligatorio informe a los participante del proyecto.",
    "La persona que exponga la información del proyecto deberá estar autorizado observando la normativa internacional de información científica y citar las fuentes de las mismas."
  ];
  
  for (let i = 0; i < secondListItems.length; i++) {
    // Check for page break before drawing the number
    const pageCheck = checkForNewPage(
      pdfDoc, 
      currentPage, 
      yPosition, 
      30,
      timesRomanFont,
      headerImagePath,
      footerImagePath,
      currentPageNumber
    );
    
    currentPage = pageCheck.page;
    yPosition = pageCheck.yPosition;
    currentPageNumber = pageCheck.pageNumber;
    
    // Draw the number
    currentPage.drawText(`${i+1}-`, {
      x: 70,
      y: yPosition,
      size: 11,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw the text with indentation
    const itemResult = drawJustifiedText(
      pdfDoc,
      currentPage, 
      secondListItems[i], 
      90, // Indented
      yPosition, 
      450, // Slightly narrower width due to indentation
      13, 
      timesRomanFont, 
      rgb(0, 0, 0),
      15, // Adjusted line height
      headerImagePath,
      footerImagePath,
      currentPageNumber
    );
    
    yPosition = itemResult.yPosition;
    currentPage = itemResult.page;
    currentPageNumber = itemResult.pageNumber;
    yPosition -= 11; // Extra space between list items
  }
  
  // Check if we need a new page before the signature section
  const finalPageCheck = checkForNewPage(
    pdfDoc, 
    currentPage, 
    yPosition, 
    200, // We need significant space for signature section
    timesRomanFont,
    headerImagePath,
    footerImagePath,
    currentPageNumber
  );
  
  currentPage = finalPageCheck.page;
  yPosition = finalPageCheck.yPosition;
  currentPageNumber = finalPageCheck.pageNumber;
  
  // Date line
  yPosition -= 40;
  const dateText = `En Guayaquil, a ${day} del mes de ${month} de ${year},`;
  currentPage.drawText(dateText, {
    x: 60,
    y: yPosition,
    size: 13,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Signature line
  yPosition -= 80; // Space for signature
  currentPage.drawLine({
    start: { x: 60, y: yPosition },
    end: { x: 340, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  // Signature label
  yPosition -= 15;
  currentPage.drawText("Firma del responsable del proyecto de investigación", {
    x: 60,
    y: yPosition,
    size: 13,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Format name and details
  const fullName = `${title} ${firstName} ${middleName} ${firstSurname} ${secondSurname}`.trim();
  yPosition -= 15;
  currentPage.drawText(fullName, {
    x: 60,
    y: yPosition,
    size: 13,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // ID line
  yPosition -= 15;
  currentPage.drawText(`${identificationType}: ${identificationNumber}`, {
    x: 60,
    y: yPosition,
    size: 13,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Vinculation line
  const vinculationText = vinculationType === 'external' || vinculationType === 'INVESTIGADOR EXTERNO'
    ? `Investigador en ${externalInstitution}`
    : 'Investigador en ESPOL';
  
  yPosition -= 15;
  currentPage.drawText(vinculationText, {
    x: 60,
    y: yPosition,
    size: 13,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Footer image removed as requested
  
  // Codification at the bottom
  currentPage.drawText(codification, {
    x: 60,
    y: 50,
    size: 13,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Page number
  currentPage.drawText(currentPageNumber.toString(), {
    x: width - 60,
    y: 50,
    size: 13,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });
  
  // Serialize the PDF to bytes
  return pdfDoc.save();
}

// Helper function to format text to fit a specified width
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

// Function to draw justified text on the page
// Helper function to check if we need to add a new page
function checkForNewPage(
  pdfDoc: any,
  page: any,
  yPosition: number,
  minHeightNeeded: number = 50,
  timesRomanFont: any,
  headerImagePath?: string,
  footerImagePath?: string,
  pageNumber: number = 1
): { page: any, yPosition: number, pageNumber: number } {
  const { height } = page.getSize();
  
  // Check if we're about to run out of space
  if (yPosition < minHeightNeeded) {
    // Create a new page
    const newPage = pdfDoc.addPage([595.28, 841.89]); // A4 size
    pageNumber++;
    
    // Add header to new page if needed
    if (headerImagePath) {
      try {
        // We need to use fs from parameters, not dynamically require it
        // This is an async function so promises should be awaited in the main function
        // Just log the error in this case
        console.log('New page header would be added here');
      } catch (error) {
        console.error('Error adding header to new page:', error);
      }
    }
    
    // Add footer to new page if needed
    if (footerImagePath) {
      try {
        // Same issue as with header
        console.log('New page footer would be added here');
      } catch (error) {
        console.error('Error adding footer to new page:', error);
      }
    }
    
    // Add page number
    newPage.drawText(pageNumber.toString(), {
      x: newPage.getWidth() - 60,
      y: 50,
      size: 13,
      font: timesRomanFont,
      color: rgb(0, 0, 0),
    });
    
    return { page: newPage, yPosition: height - 100, pageNumber };
  }
  
  return { page, yPosition, pageNumber };
}

function drawJustifiedText(
  pdfDoc: any,
  page: any,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize: number,
  font: any,
  color: any,
  lineHeight: number = 15, // Reduced line height
  headerImagePath?: string,
  footerImagePath?: string,
  pageNumber: number = 1
): { yPosition: number, page: any, pageNumber: number } {
  // Always ensure fontSize is at least 16 for main text
  const effectiveFontSize = fontSize < 13 && fontSize > 10 ? 13 : fontSize;
  const lines = formatTextToWidth(text, width, effectiveFontSize, font);
  let yPosition = y;
  let currentPage = page;
  let currentPageNumber = pageNumber;
  
  // Draw each line
  for (const line of lines) {
    // Check if we need a new page before drawing this line
    const pageCheck = checkForNewPage(
      pdfDoc, 
      currentPage, 
      yPosition, 
      30, // Minimum space needed for a line of text
      font,
      headerImagePath,
      footerImagePath,
      currentPageNumber
    );
    
    currentPage = pageCheck.page;
    yPosition = pageCheck.yPosition;
    currentPageNumber = pageCheck.pageNumber;
    
    // Justificar el texto distribuindo espacios uniformemente
    if (line.trim() !== '') {
      const words = line.split(' ');
      const textWidth = font.widthOfTextAtSize(line, fontSize);
      const availableWidth = width;
      
      // Determinar si es la última línea del párrafo
      // Asumimos que es la última línea si ocupa menos del 85% del ancho disponible
      const isLastLine = textWidth < (availableWidth * 0.85);
      
      // Si es la última línea del párrafo o la línea no tiene espacios, no justificar
      if (words.length <= 1 || isLastLine) {
        currentPage.drawText(line, {
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
          currentPage.drawText(words[i], {
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
  
  return { yPosition, page: currentPage, pageNumber: currentPageNumber }; // Return updated values
}
