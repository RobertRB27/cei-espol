import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';

// Helper function to get application data
async function getApplicationData(id: string) {
  const result = await query(
    `SELECT 
      a.id, 
      a.user_id, 
      a.project_title, 
      a.investigation_type, 
      a.category_type, 
      a.sequential_number, 
      a.codification, 
      a.date_created, 
      a.date_submitted, 
      a.status,
      a.metadata,
      u.email,
      u.first_name,
      u.last_name
    FROM applications.applications a
    JOIN users.users u ON a.user_id = u.id
    WHERE a.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; type: string } }
) {
  try {
    // Get the current session to verify authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id, type } = params;
    
    // Validate document type
    const validTypes = ['solicitud', 'evaluacion', 'consentimiento', 'conflictos'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }
    
    // Get application data
    const applicationData = await getApplicationData(id);
    
    if (!applicationData) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    // Get user ID from session email
    let userId;
    try {
      if (session.user.email) {
        const userResult = await query(
          `SELECT id, role_id FROM users.users WHERE email = $1 LIMIT 1`,
          [session.user.email]
        );
        
        if (userResult.rows.length === 0) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        userId = userResult.rows[0].id;
        const roleId = userResult.rows[0].role_id;
        
        // Check if user has permission to view this application
        // Only the application owner, reviewers (role 3), and managers (role 2) can view
        if (applicationData.user_id !== userId && roleId !== 2 && roleId !== 3) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'User email not found in session' }, { status: 400 });
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    // This would generate a PDF in a real application
    // For now, we'll return mock data representing what the PDF would contain
    const documentData = {
      id: applicationData.id,
      type,
      codification: applicationData.codification,
      projectTitle: applicationData.project_title,
      investigationType: applicationData.investigation_type,
      metadata: applicationData.metadata,
      userName: `${applicationData.first_name} ${applicationData.last_name}`,
      userEmail: applicationData.email,
      dateCreated: applicationData.date_created,
      generatedAt: new Date().toISOString(),
    };
    
    // In a real application, this would be a PDF stream
    // For now, just return JSON data
    return NextResponse.json(documentData);
  } catch (error) {
    console.error(`Error generating ${params.type} document:`, error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
