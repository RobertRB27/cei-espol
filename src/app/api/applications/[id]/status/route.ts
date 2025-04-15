import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';

// API endpoint to change application status
export async function PUT(
  request: NextRequest,
  // Usaremos any temporalmente para permitir la compilación
  context: any
) {
  try {
    const { params } = context;
    const id = params.id;
    
    // Get body data containing new status and comments
    const body = await request.json();
    const { status, comments } = body;
    
    if (!status || !['SECOND_REVIEW', 'REJECTED', 'NOT_COMPLETED', 'ACCEPTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    // Get current session and verify authentication
    const session = await getServerSession();
    console.log('Status Update - Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get reviewer ID from email since it's missing from session
    let reviewerId;
    let roleId;
    try {
      if (session.user.email) {
        const userResult = await query(
          `SELECT id, role_id FROM users.users WHERE email = $1 LIMIT 1`,
          [session.user.email]
        );
        
        if (userResult.rows.length > 0) {
          reviewerId = userResult.rows[0].id;
          roleId = userResult.rows[0].role_id;
          console.log('Found reviewer ID:', reviewerId, 'with role:', roleId);
          
          // Verify user has reviewer role (role_id = 3) or manager role (role_id = 2)
          if (roleId !== 3 && roleId !== 2) {
            console.log('User does not have proper role (role_id = 3 or 2)');
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching reviewer ID:', err);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
    
    // First, check if application exists and get current status
    const applicationResult = await query(
      `SELECT status FROM applications.applications WHERE id = $1`,
      [id]
    );
    
    if (applicationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    
    const previousStatus = applicationResult.rows[0].status;
    console.log('Current application status:', previousStatus);
    
    // Verify application is in proper state to be updated
    // Role 3 (Reviewer) can only change UNDER_REVIEW applications
    // Role 2 (Manager) can only change SECOND_REVIEW applications
    if ((roleId === 3 && previousStatus !== 'UNDER_REVIEW') ||
        (roleId === 2 && previousStatus !== 'SECOND_REVIEW')) {
      return NextResponse.json({ 
        error: 'Cannot change status of application in its current state' 
      }, { status: 400 });
    }
    
    // Begin transaction
    try {
      await query('BEGIN');
      console.log('Transaction started successfully');
    } catch (err) {
      console.error('Error starting transaction:', err);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    const now = new Date();
    
    try {
      // Update application status
      console.log(`Updating application ${id} from ${previousStatus} to ${status}`);
      await query(
        `UPDATE applications.applications SET status = $1 WHERE id = $2`,
        [status, id]
      );
      
      // Add entry to status history
      console.log('Adding status history entry');
      await query(
        `INSERT INTO applications.status_history
        (application_id, previous_status, new_status, changed_by, change_date, comments)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, previousStatus, status, reviewerId, now, comments || null]
      );
      
      // Add review record if it's a reviewer action
      if (roleId === 3) {
        console.log('Adding review record');
        await query(
          `INSERT INTO applications.reviews
          (application_id, reviewer_id, status, comments, date_assigned, date_reviewed)
          VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, reviewerId, status, comments || null, now, now]
        );
      }
      
      await query('COMMIT');
      console.log('Transaction committed successfully');
      
      return NextResponse.json({ 
        success: true, 
        message: `Application status updated to ${status}`
      });
      
    } catch (error) {
      // Rollback transaction in case of error
      try {
        console.error('Error updating application status, rolling back');
        await query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      
      console.error('Error updating application status:', error);
      return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in status update API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
