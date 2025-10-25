"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "./session";

export async function login(password: string) {
  try {
    // Optimize: Early validation to avoid session creation for invalid passwords
    if (!password || password !== process.env.APP_PASSWORD) {
      return { error: "Invalid password" };
    }

    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
      cookieStore,
      sessionOptions
    );

    session.isAuthenticated = true;
    await session.save();
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
