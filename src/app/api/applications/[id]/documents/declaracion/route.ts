import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { query } from '@/lib/db';
import { generateDeclaracionPDF } from '@/lib/pdf/declaracion-template';

// Generate the Declaración de Asunción de Responsabilidad document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check if this is a download request or just a preview
  const searchParams = request.nextUrl.searchParams;
  const isDownload = searchParams.get('download') === 'true';
  try {
    // Properly handle params.id in an async context as required by Next.js
    const { id } = params;
    console.log('Starting Declaracion PDF generation for application:', id);
    
    // Get the current session to verify authentication
    const session = await getServerSession();
    console.log('Session user:', session?.user?.email);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const applicationId = parseInt(id);
    console.log('Processing application ID:', applicationId);
    
    if (isNaN(applicationId)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }
    
    // Get the application data
    console.log('Fetching application data from database');
    
    const applicationResult = await query(
      `SELECT a.*, a.metadata FROM applications.applications a
       WHERE a.id = $1`,
      [applicationId]
    );
    
    console.log('Database query result rows:', applicationResult.rows.length);
    
    if (applicationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    const application = applicationResult.rows[0];
    console.log('Application data loaded:', application.codification, application.project_title);
    
    // Define proper type for metadata
    interface ApplicationMetadata {
      title?: string;
      first_name?: string;
      middle_name?: string;
      first_surname?: string;
      second_surname?: string;
      identification_type?: string;
      identification_number?: string;
      vinculation_type?: string;
      external_institution?: string;
      [key: string]: any; // Allow for other properties
    }
    
    // Parse metadata if it exists
    let metadata: ApplicationMetadata = {};
    try {
      let rawMetadata = application.metadata || {};
      if (typeof rawMetadata === 'string') {
        rawMetadata = JSON.parse(rawMetadata);
      }
      metadata = rawMetadata as ApplicationMetadata;
    } catch (error) {
      console.error('Error parsing metadata:', error);
      metadata = {};
    }
    
    console.log('Application metadata parsed');
    console.log('Metadata:', JSON.stringify(metadata, null, 2));
    
    // Extract the needed data for the PDF
    const pdfData = {
      codification: application.codification,
      title: metadata.title || '',
      firstName: metadata.first_name || '',
      middleName: metadata.middle_name || '',
      firstSurname: metadata.first_surname || '',
      secondSurname: metadata.second_surname || '',
      identificationType: metadata.identification_type || 'Cédula',
      identificationNumber: metadata.identification_number || '',
      vinculationType: metadata.vinculation_type || 'ESPOL',
      externalInstitution: metadata.external_institution || '',
    };
    
    // Generate the PDF
    const pdfBytes = await generateDeclaracionPDF(pdfData);
    
    // Return the PDF - either as a preview or downloadable file
    const headers: HeadersInit = {
      'Content-Type': 'application/pdf',
    };
    
    // If download flag is set, add Content-Disposition header for download
    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="Declaracion_${application.codification}.pdf"`;
    } else {
      // For preview, use inline disposition
      headers['Content-Disposition'] = 'inline';
    }
    
    return new NextResponse(pdfBytes, { headers });
  } catch (error) {
    console.error('Error generating declaracion PDF:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Error generating document', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
