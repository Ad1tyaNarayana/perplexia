import { createFileRoute, redirect } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";

export const Route = createFileRoute("/login/sso-callback")({
  component: FactorOnePage,
  beforeLoad: async ({}) => {
    // Check if the user is already authenticated and redirect them if they are
    const token = localStorage.getItem("clerk-token");
    if (token) {
      // Use navigate from the context and throw it to cause a redirect
      throw redirect({ to: "/chat" });
    }
  },
});

function FactorOnePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#191a1a]">
      <div className="w-full max-w-md">
        <SignIn
          path="/login"
          routing="path"
          signInUrl="/login"
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#ffffff",
              colorBackground: "#202222",
              colorInputBackground: "#191a1a",
              colorInputText: "#ffffff",
              colorTextOnPrimaryBackground: "#191a1a",
              fontFamily: "monospace",
            },
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
        />
      </div>
    </div>
  );
}
