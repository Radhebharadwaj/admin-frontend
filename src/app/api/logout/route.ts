import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Redirect to the root/login page
  const url = new URL('/', request.url);
  const response = NextResponse.redirect(url);

  // Nuke every possible cookie name the app might be using via the Response object
  response.cookies.delete('admin-session');
  response.cookies.delete('token');
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('__Secure-next-auth.session-token');
  
  return response;
}
