// src/test/auth-form.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthProvider } from "@/lib/hooks/useAuth"; // Import AuthProvider
import { createClient } from "@/lib/supabase/client";
import fetch from "node-fetch";
jest.mock("node-fetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  })),
}));

describe("LoginForm", () => {
  it("should render the login form", () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("should display validation errors for empty fields", async () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    const signInButton = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
    });
  });

  it("should call signIn with correct credentials on form submission", async () => {
    const mockSignIn = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockImplementation(() => ({
      auth: {
        signInWithPassword: mockSignIn,
      },
    }));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const signInButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
      });
    });
  });

  it("should display an error message if sign in fails", async () => {
    const mockError = new Error("Invalid credentials");
    (createClient as jest.Mock).mockImplementation(() => ({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({ error: mockError }),
      },
    }));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>,
    );

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const signInButton = screen.getByRole("button", { name: "Sign In" });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });
});

describe("RegisterForm", () => {
  it("should render the register form", () => {
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>,
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Account" }),
    ).toBeInTheDocument();
  });

  it("should display validation errors for empty fields", async () => {
    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>,
    );

    const createAccountButton = screen.getByRole("button", {
      name: "Create Account",
    });
    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(screen.getByText("First name is required")).toBeInTheDocument();
      expect(screen.getByText("Last name is required")).toBeInTheDocument();
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Username is required")).toBeInTheDocument();
      expect(screen.getByText("Password is required")).toBeInTheDocument();
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
      expect(
        screen.getByText("You must accept the terms and conditions"),
      ).toBeInTheDocument();
    });
  });

  it("should call signUp with correct credentials on form submission", async () => {
    const mockSignUp = jest.fn().mockResolvedValue({ error: null });
    (createClient as jest.Mock).mockImplementation(() => ({
      auth: {
        signUp: mockSignUp,
      },
    }));

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>,
    );

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const acceptTermsCheckbox = screen.getByLabelText(
      "I agree to the Terms of Service and Privacy Policy",
    );
    const createAccountButton = screen.getByRole("button", {
      name: "Create Account",
    });

    fireEvent.change(firstNameInput, { target: { value: "Test" } });
    fireEvent.change(lastNameInput, { target: { value: "User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password" } });
    fireEvent.click(acceptTermsCheckbox);
    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password",
        options: {
          data: {
            username: "testuser",
            first_name: "Test",
            last_name: "User",
            full_name: "Test User",
          },
        },
      });
    });
  });

  it("should display an error message if sign up fails", async () => {
    const mockError = new Error("Registration failed");
    (createClient as jest.Mock).mockImplementation(() => ({
      auth: {
        signUp: jest.fn().mockResolvedValue({ error: mockError }),
      },
    }));

    render(
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>,
    );

    const firstNameInput = screen.getByLabelText("First Name");
    const lastNameInput = screen.getByLabelText("Last Name");
    const emailInput = screen.getByLabelText("Email");
    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText("Confirm Password");
    const acceptTermsCheckbox = screen.getByLabelText(
      "I agree to the Terms of Service and Privacy Policy",
    );
    const createAccountButton = screen.getByRole("button", {
      name: "Create Account",
    });

    fireEvent.change(firstNameInput, { target: { value: "Test" } });
    fireEvent.change(lastNameInput, { target: { value: "User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "password" } });
    fireEvent.click(acceptTermsCheckbox);
    fireEvent.click(createAccountButton);

    await waitFor(() => {
      expect(screen.getByText("Registration failed")).toBeInTheDocument();
    });
  });
});
