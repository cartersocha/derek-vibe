"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "./session";
import { verifyPassword } from "./password-utils";

export async function login(password: string) {
  try {
    const appPassword = process.env.APP_PASSWORD;
    
    // Debug logging for build environment
    console.log("=== LOGIN DEBUG ===");
    console.log("APP_PASSWORD exists:", !!appPassword);
    console.log("APP_PASSWORD length:", appPassword?.length);
    console.log("Input password length:", password?.length);
    console.log("APP_PASSWORD value:", JSON.stringify(appPassword));
    console.log("Input password value:", JSON.stringify(password));
    
    // More robust password comparison
    if (!password || !appPassword) {
      console.log("Missing password or APP_PASSWORD");
      return { error: "Invalid password" };
    }
    
    // Use robust password verification
    const isValid = verifyPassword(password, appPassword);
    console.log("Password verification result:", isValid);
    
    if (!isValid) {
      console.log("Password verification failed");
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
