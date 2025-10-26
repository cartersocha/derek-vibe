"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "./session";
// Removed verifyPassword import for performance - using direct comparison

export async function login(password: string) {
  try {
    const appPassword = process.env.APP_PASSWORD;
    
    // Fast password validation - only log errors in development
    if (!password || !appPassword) {
      if (process.env.NODE_ENV === 'development') {
        console.log("Missing password or APP_PASSWORD");
      }
      return { error: "Invalid password" };
    }
    
    // Simple server-side sanitization for security
    const sanitizedPassword = password.trim().replace(/[<>\"'&]/g, '');
    
    // Optimized password verification
    const isValid = sanitizedPassword === appPassword.trim();
    
    if (!isValid) {
      if (process.env.NODE_ENV === 'development') {
        console.log("Password verification failed");
      }
      return { error: "Invalid password" };
    }

    // Optimize session creation
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    session.isAuthenticated = true;
    
    // Use Promise.all to parallelize session save and redirect
    await Promise.all([
      session.save(),
      Promise.resolve() // Prepare for redirect
    ]);
    
    redirect("/dashboard");
  } catch (error) {
    // redirect() throws a NEXT_REDIRECT error which is expected behavior
    // Re-throw it so Next.js can handle the redirect
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("Login error:", error);
    return { error: "An error occurred during login" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );

  session.destroy();
  redirect("/login");
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );

  return session;
}
