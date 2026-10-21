import { NextResponse } from 'next/server';
import { resetPasswordAction } from '@/lib/actions/auth.actions';

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json();
    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and newPassword are required' }, { status: 400 });
    }
    const result = await resetPasswordAction(email, newPassword);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
