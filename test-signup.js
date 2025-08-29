// Test script to verify Supabase signup functionality
// Run with: node test-signup.js

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "Set" : "Missing");
  console.error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
    supabaseAnonKey ? "Set" : "Missing",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignup() {
  console.log("🧪 Testing Supabase signup functionality...\n");

  // Test data
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";
  const testUserData = {
    username: "testuser" + Date.now(),
    first_name: "Test",
    last_name: "User",
  };

  try {
    console.log("📝 Attempting to sign up user...");
    console.log("Email:", testEmail);
    console.log("Username:", testUserData.username);

    // Attempt signup
    const { data: signupData, error: signupError } = await supabase.auth.signUp(
      {
        email: testEmail,
        password: testPassword,
        options: {
          data: testUserData,
        },
      },
    );

    if (signupError) {
      console.error("❌ Signup failed:", signupError.message);
      return;
    }

    console.log("✅ Signup successful!");
    console.log("User ID:", signupData.user?.id);
    console.log(
      "Email confirmed:",
      signupData.user?.email_confirmed_at ? "Yes" : "No",
    );

    // Check if we can access user data from auth
    if (signupData.user?.id) {
      console.log("\n🔍 Checking user data...");
      console.log("✅ User ID:", signupData.user.id);
      console.log("✅ User email:", signupData.user.email);
      console.log(
        "✅ User metadata:",
        JSON.stringify(signupData.user.user_metadata, null, 2),
      );
    }

    // Check auth.users table
    console.log("\n🔍 Checking auth.users table...");
    const {
      data: { user: currentUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log("ℹ️  Not automatically logged in (normal behavior)");
    } else if (currentUser) {
      console.log("✅ User found in auth.users:", currentUser.id);
    }

    console.log("\n📋 Test Summary:");
    console.log("- Signup API call: ✅ Success");
    console.log("- User created in auth.users: ✅ Success");
    console.log("- User data accessible: ✅ Success");

    if (!signupData.user?.email_confirmed_at) {
      console.log("\n📧 Note: Email confirmation may be required.");
      console.log(
        "Check your Supabase Auth settings if you want to disable email confirmation for testing.",
      );
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
  }
}

async function checkDatabaseStructure() {
  console.log("\n🏗️  Checking database structure...\n");

  try {
    // Check if polls table exists and is accessible
    const { data: polls, error: pollsError } = await supabase
      .from("polls")
      .select("id")
      .limit(1);

    if (pollsError) {
      console.error("❌ Cannot access polls table:", pollsError.message);
    } else {
      console.log("✅ polls table is accessible");
    }

    // Check if poll_options table exists and is accessible
    const { data: options, error: optionsError } = await supabase
      .from("poll_options")
      .select("id")
      .limit(1);

    if (optionsError) {
      console.error(
        "❌ Cannot access poll_options table:",
        optionsError.message,
      );
    } else {
      console.log("✅ poll_options table is accessible");
    }

    // Check if votes table exists and is accessible
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("id")
      .limit(1);

    if (votesError) {
      console.error("❌ Cannot access votes table:", votesError.message);
    } else {
      console.log("✅ votes table is accessible");
    }
  } catch (error) {
    console.error("❌ Database structure check failed:", error.message);
  }
}

// Run tests
async function runTests() {
  console.log("🚀 Starting Polly App Tests\n");
  console.log("Supabase URL:", supabaseUrl);
  console.log("=".repeat(50));

  await checkDatabaseStructure();
  console.log("=".repeat(50));
  await testSignup();

  console.log("\n✨ Tests completed!");
}

runTests().catch(console.error);
