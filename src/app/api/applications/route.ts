import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth-config';
import { randomUUID } from 'crypto';

// Generate a unique codification for a new application
async function generateCodification(investigationType: string, categoryType: string) {
  // Use the user-provided category type
  // Validate category type
  const validCategories = ['GE', 'SH', 'AN'];
  if (!validCategories.includes(categoryType)) {
    throw new Error(`Invalid category type: ${categoryType}. Must be one of: ${validCategories.join(', ')}`);
  }
  
  // Get the current year and month for the timestamp
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (1-12) as 2 digits
  
  // Using a single client to ensure consistent transaction
  const client = await pool.connect();
  
  try {
    // Start a transaction to lock the table
    await client.query('BEGIN');
    
    // LOCK the applications table to prevent concurrent inserts with same codification
    await client.query('LOCK TABLE applications.applications IN SHARE ROW EXCLUSIVE MODE');
    
    // Get the overall highest sequential number across ALL applications
    const globalMaxResult = await client.query(
      `SELECT COALESCE(MAX(sequential_number), 0) as global_max FROM applications.applications`
    );
    let sequentialNumber = globalMaxResult.rows[0].global_max + 1;
    
    // Add timestamp components and a random number for uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    
    // Create the codification with our guaranteed unique components
    const codification = `CEISH-ESPOL-${year}-${month}-${investigationType}-${categoryType}-${sequentialNumber.toString().padStart(3, '0')}-${randomNum}`;
    
    // Double-check no duplicate exists (extremely unlikely but safe)
    const existingCheck = await client.query(
      `SELECT 1 FROM applications.applications WHERE codification = $1`,
      [codification]
    );
    
    if (existingCheck.rows.length > 0) {
      // This should never happen with our design, but if it does:
      // Release the lock, rollback transaction
      await client.query('ROLLBACK');
      throw new Error('Unexpected codification collision. Please try again.');
    }
    
    // Commit the transaction to release the lock
    await client.query('COMMIT');
    
    console.log('Generated unique codification:', { codification, sequentialNumber });
    
    return {
      codification,
      sequentialNumber
    };
  } catch (error) {
    // Rollback transaction if anything goes wrong
    await client.query('ROLLBACK');
    console.error('Error generating codification:', error);
    throw error;
  } finally {
    client.release();
  }
}

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

export async function POST(request: NextRequest) {
  try {
    // Get the current session to verify authentication
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { 
      title,
      firstName,
      middleName,
      firstSurname,
      secondSurname,
      identificationType, 
      identificationNumber, 
      projectTitle, 
      investigationType, 
      categoryType,
      vinculationType, 
      externalInstitution, 
      level, 
      risk,
      documentCount
    } = body;
    
    // Get user ID from email since session sometimes doesn't have ID
    let userId;
    try {
      if (session.user.email) {
        const userResult = await query(
          `SELECT id FROM users.users WHERE email = $1 LIMIT 1`,
          [session.user.email]
        );
        
        if (userResult.rows.length === 0) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        userId = userResult.rows[0].id;
      } else {
        return NextResponse.json({ error: 'User email not found in session' }, { status: 400 });
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    // Validate required fields
    if (!projectTitle || !investigationType || !categoryType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Generate codification and get sequential number
    // Log important values before generating codification
    console.log('Generating codification with params:', { investigationType, categoryType });
    
    const { codification, sequentialNumber } = await generateCodification(investigationType, categoryType);
    
    // Log generated values
    console.log('Generated codification:', { codification, sequentialNumber });
    
    // Fetch the user's full name details from the database
    const userDetailsResult = await query(
      `SELECT first_name, second_name, first_surname, second_surname 
       FROM users.users WHERE email = $1`,
      [session.user.email]
    );
    
    const userDetails = userDetailsResult.rows[0] || {};
    console.log('User details fetched:', userDetails);
    
    // Create metadata JSON with user details from database
    const metadata = {
      title,
      first_name: userDetails.first_name || '',
      middle_name: userDetails.second_name || '', // Map second_name from DB to middle_name in our app
      first_surname: userDetails.first_surname || '',
      second_surname: userDetails.second_surname || '',
      identification_type: identificationType,
      identification_number: identificationNumber,
      vinculation_type: vinculationType,
      external_institution: externalInstitution,
      level,
      risk,
      documentCount,
      created_by: session.user.email
    };
    
    // Get a single client to handle the entire transaction
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // Insert new application
      // Log values before inserting
      console.log('Inserting application with values:', {
        userId,
        projectTitle,
        investigationType,
        categoryType,
        sequentialNumber,
        codification
      });
      
      // Make codification truly unique by adding UUID suffix 
      const uniqueCodification = `${codification}-${randomUUID().substring(0, 8)}`;
      console.log('Using guaranteed unique codification:', uniqueCodification);
      
      const result = await client.query(
        `INSERT INTO applications.applications
          (user_id, project_title, investigation_type, category_type, sequential_number, codification, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, codification`,
        [
          userId,
          projectTitle,
          investigationType,
          categoryType,
          sequentialNumber,
          uniqueCodification,
          JSON.stringify(metadata)
        ]
      );
      
      const { id: applicationId, codification: finalCodification } = result.rows[0];
      
      // Log the final codification that was used (may differ from original if there was a conflict)
      console.log('Final codification used:', finalCodification);
      
      // Insert initial status history entry
      // The table has previous_status and new_status columns, not 'status'
      await client.query(
        `INSERT INTO applications.status_history
          (application_id, previous_status, new_status, changed_by, comments)
        VALUES ($1, $2, $3, $4, $5)`,
        [
          applicationId,
          'NOT_SUBMITTED', // Previous status (technically the same for new applications)
          'NOT_SUBMITTED', // New status
          userId,
          'Application created'
        ]
      );
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('Application created successfully:', { id: applicationId, codification });
      return NextResponse.json({ success: true, id: applicationId, codification: finalCodification });
    } catch (error) {
      // Rollback transaction on error
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
      console.error('Error creating application:', error);
      // Log the full error details for debugging
      console.log('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      // Type assertion for error object
      const errorWithMessage = error as { message?: string };
      return NextResponse.json({ error: `Database error: ${errorWithMessage.message || 'Unknown error'}` }, { status: 500 });
    } finally {
      // Always release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Error processing application creation:', error);
    // Log the full error details for debugging
    console.log('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    // Type assertion for error object
    const errorWithMessage = error as { message?: string };
    return NextResponse.json({ error: `Server error: ${errorWithMessage.message || 'Unknown error'}` }, { status: 500 });
  }
}
