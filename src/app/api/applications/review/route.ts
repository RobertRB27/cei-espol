import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';

export async function GET(request: NextRequest) {
  try {
    // Get the current session to verify authentication
    const session = await getServerSession();
    
    // Log session for debugging
    console.log('Review - Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log user info for debugging
    console.log('Review - User:', JSON.stringify(session.user, null, 2));
    
    // Get reviewer ID from the database using email since it's missing from session
    let reviewerId;
    try {
      if (session.user.email) {
        const userResult = await query(
          `SELECT id, role_id FROM users.users WHERE email = $1 LIMIT 1`,
          [session.user.email]
        );
        
        if (userResult.rows.length > 0) {
          reviewerId = userResult.rows[0].id;
          const roleId = userResult.rows[0].role_id;
          console.log('Found reviewer ID from email:', reviewerId, 'with role:', roleId);
          
          // Verify user has appropriate role (role_id = 3 for Reviewers)
          if (roleId !== 3) {
            console.log('User does not have reviewer role (role_id = 3)');
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching reviewer ID from email:', err);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    // Query the database for applications under review
    console.log('Fetching applications for reviewer:', reviewerId);
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
      WHERE a.status = 'UNDER_REVIEW'
      ORDER BY a.date_submitted DESC`,
      []
    );

    console.log('Found', result.rows.length, 'applications for review');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching applications for review:', error);
    return NextResponse.json({ error: 'Failed to fetch applications for review' }, { status: 500 });
  }
}
