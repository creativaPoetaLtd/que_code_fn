import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const formData = new URLSearchParams();
    formData.append('title', body.title || 'Test Notification');
    formData.append('message', body.message || 'This is a test notification');
    formData.append('url', body.url || 'http://localhost:3000');

    const response = await fetch('https://api.pushalert.co/rest/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'api_key=9ba563f8f5c09ff904fa70f376348d08',
      },
      body: formData.toString(),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
