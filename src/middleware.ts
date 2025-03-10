import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next|_vercel|api\/webhook).*)", "/", "/(api|trpc)(.*)"],
};