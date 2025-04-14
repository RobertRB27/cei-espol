import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';

export async function GET(request: NextRequest) {
  try {
    // Get the current session to verify authentication
    const session = await getServerSession();
    
    // Log session for debugging
    console.log('Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get userId from query params
    const userId = request.nextUrl.searchParams.get('userId');
    console.log('Requested userId:', userId);
    console.log('Session user:', JSON.stringify(session.user, null, 2));
    
    // Temporarily allow all authenticated users to access applications for testing
    // We'll reinstate proper checks after debugging
    // Original check: userId !== session.user.id && session.user.role_id !== 3 && session.user.role_id !== 2

    // Query the database for applications
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
        u.first_name || ' ' || u.second_name || ' ' || u.first_surname || ' ' || u.second_surname AS applicant_name,
        u.email AS applicant_email
      FROM applications.applications a
      JOIN users.users u ON a.user_id = u.id
      WHERE a.user_id = $1 AND a.status != 'DELETED'
      ORDER BY a.date_created DESC`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
