import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ received: true }, { status: 200 });
}

// Add a quick GET handler just in case they ping it normally
export async function GET() {
  return NextResponse.json({ status: "Nomba webhook active" }, { status: 200 });
}
