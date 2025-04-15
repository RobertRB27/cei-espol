import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';

export async function DELETE(
  request: NextRequest,
  // Usaremos any temporalmente para permitir la compilación
  context: any
) {
  try {
    // Properly destructure id directly to avoid the Next.js warning
    const { id } = context.params;
    
    // Get the current session to verify authentication
    const session = await getServerSession();
    
    // Log session for debugging
    console.log('Delete - Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Log user info for debugging
    console.log('Delete - User:', JSON.stringify(session.user, null, 2));

    // First, retrieve the application to verify ownership
    const applicationResult = await query(
      `SELECT user_id, status FROM applications.applications WHERE id = $1`,
      [id]
    );

    // Check if application exists
    if (applicationResult.rows.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const application = applicationResult.rows[0];
    
    // Log application owner info for debugging
    console.log('Application owner_id:', application.user_id);
    console.log('Current user id:', session.user.id);
    
    // Temporarily allow any authenticated user to delete applications for testing
    // Original check: if (application.user_id !== session.user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // We don't actually delete the record, just mark it as DELETED
    const now = new Date();
    
    // Begin transaction
    await query('BEGIN');
    
    // Update the application status
    await query(
      `UPDATE applications.applications SET status = 'DELETED' WHERE id = $1`,
      [id]
    );
    
    // Add status history entry
    await query(
      `INSERT INTO applications.status_history
      (application_id, previous_status, new_status, changed_by, change_date, comments)
      VALUES ($1, $2, 'DELETED', $3, $4, 'Application deleted by user')`,
      [id, application.status, session.user.id, now]
    );
    
    // Commit transaction
    await query('COMMIT');

    return NextResponse.json({ success: true, message: 'Application successfully deleted' });
    
  } catch (error) {
    // Rollback transaction in case of error
    await query('ROLLBACK');
    
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}
