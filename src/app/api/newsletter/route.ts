import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { newsletterSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = newsletterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: result.error.errors[0]?.message || 'Invalid email' 
          } 
        },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Insert into database
    const supabase = await createClient();
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email });

    if (error) {
      // Handle duplicate email
      if (error.code === '23505') {
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'ALREADY_EXISTS', 
              message: 'This email is already subscribed' 
            } 
          },
          { status: 400 }
        );
      }

      console.error('Newsletter subscription error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'INTERNAL_ERROR', 
            message: 'Failed to subscribe. Please try again.' 
          } 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: { message: 'Successfully subscribed!' } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Newsletter API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Something went wrong' 
        } 
      },
      { status: 500 }
    );
  }
}

