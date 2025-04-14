import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';

export async function GET(request: NextRequest) {
  try {
    // Get the current session to verify authentication
    const session = await getServerSession();
    
    // Log session for debugging
    console.log('Manage - Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log user info for debugging
    console.log('Manage - User:', JSON.stringify(session.user, null, 2));
    
    // Get manager ID from the database using email since it's missing from session
    let managerId;
    try {
      if (session.user.email) {
        const userResult = await query(
          `SELECT id, role_id FROM users.users WHERE email = $1 LIMIT 1`,
          [session.user.email]
        );
        
        if (userResult.rows.length > 0) {
          managerId = userResult.rows[0].id;
          const roleId = userResult.rows[0].role_id;
          console.log('Found manager ID from email:', managerId, 'with role:', roleId);
          
          // Verify user has appropriate role (role_id = 2 for Managers)
          if (roleId !== 2) {
            console.log('User does not have manager role (role_id = 2)');
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching manager ID from email:', err);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    // Query the database for applications in SECOND_REVIEW status
    console.log('Fetching applications for manager:', managerId);
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
        u.email AS applicant_email,
        r.reviewer_id,
        ru.first_name || ' ' || ru.second_name || ' ' || ru.first_surname || ' ' || ru.second_surname AS reviewer_name,
        r.comments AS reviewer_comments
      FROM applications.applications a
      JOIN users.users u ON a.user_id = u.id
      LEFT JOIN (
        SELECT DISTINCT ON (application_id) 
          application_id, 
          reviewer_id, 
          comments,
          date_reviewed
        FROM applications.reviews
        ORDER BY application_id, date_reviewed DESC
      ) r ON a.id = r.application_id
      LEFT JOIN users.users ru ON r.reviewer_id = ru.id
      WHERE a.status = 'SECOND_REVIEW'
      ORDER BY a.date_submitted DESC`,
      []
    );

    console.log('Found', result.rows.length, 'applications for management');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching applications for management:', error);
    return NextResponse.json({ error: 'Failed to fetch applications for management' }, { status: 500 });
  }
}
