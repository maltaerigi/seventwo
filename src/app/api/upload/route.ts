import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ERROR_CODES } from '@/constants';

/**
 * POST /api/upload
 * Upload a file to Supabase Storage
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Please log in' } },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'No file provided' } },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'File must be an image' } },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.VALIDATION_ERROR, message: 'File must be less than 5MB' } },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('covers')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Failed to upload file' } },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('covers')
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      data: {
        path: data.path,
        url: publicUrl,
      },
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: { code: ERROR_CODES.INTERNAL_ERROR, message: 'Something went wrong' } },
      { status: 500 }
    );
  }
}

