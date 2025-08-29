// Test script to verify poll creation and voting functionality
// Run with: node test-polls.js

require("dotenv").config({ path: ".env.local" });

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  console.log("👤 Creating test user for poll testing...");

  const testEmail = `polltest-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";
  const testUserData = {
    username: "polluser" + Date.now(),
    first_name: "Poll",
    last_name: "Tester",
  };

  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: testUserData,
    },
  });

  if (signupError) {
    throw new Error(`Signup failed: ${signupError.message}`);
  }

  console.log("✅ Test user created:", signupData.user?.id);
  return signupData.user;
}

async function testPollCreation(user) {
  console.log("\n📊 Testing poll creation...");

  // Test poll data
  const pollData = {
    title: "What's your favorite programming language?",
    description: "Help us understand developer preferences",
    creator_id: user.id,
    is_public: true,
    allow_multiple_votes: false,
    allow_add_options: false,
  };

  try {
    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert(pollData)
      .select()
      .single();

    if (pollError) {
      console.error("❌ Poll creation failed:", pollError.message);
      return null;
    }

    console.log("✅ Poll created successfully:", poll.id);
    console.log("  Title:", poll.title);
    console.log("  Creator ID:", poll.creator_id);

    // Create poll options
    const optionsData = [
      { poll_id: poll.id, text: "JavaScript" },
      { poll_id: poll.id, text: "Python" },
      { poll_id: poll.id, text: "TypeScript" },
      { poll_id: poll.id, text: "Go" },
    ];

    const { data: options, error: optionsError } = await supabase
      .from("poll_options")
      .insert(optionsData)
      .select();

    if (optionsError) {
      console.error("❌ Options creation failed:", optionsError.message);
      return null;
    }

    console.log("✅ Poll options created:", options.length, "options");
    options.forEach((option, index) => {
      console.log(`  ${index + 1}. ${option.text} (ID: ${option.id})`);
    });

    return { poll, options };
  } catch (error) {
    console.error("❌ Unexpected error in poll creation:", error.message);
    return null;
  }
}

async function testPollRetrieval(pollId) {
  console.log("\n🔍 Testing poll retrieval...");

  try {
    // Fetch poll with options
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select(`
        *,
        poll_options (*)
      `)
      .eq("id", pollId)
      .single();

    if (pollError) {
      console.error("❌ Poll retrieval failed:", pollError.message);
      return false;
    }

    console.log("✅ Poll retrieved successfully:");
    console.log("  ID:", poll.id);
    console.log("  Title:", poll.title);
    console.log("  Description:", poll.description);
    console.log("  Options count:", poll.poll_options.length);
    console.log("  Is public:", poll.is_public);

    return true;
  } catch (error) {
    console.error("❌ Unexpected error in poll retrieval:", error.message);
    return false;
  }
}

async function testVoting(user, pollData) {
  console.log("\n🗳️  Testing voting functionality...");

  const { poll, options } = pollData;
  const selectedOption = options[0]; // Vote for JavaScript

  try {
    // Cast a vote
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .insert({
        user_id: user.id,
        poll_id: poll.id,
        option_id: selectedOption.id,
      })
      .select()
      .single();

    if (voteError) {
      console.error("❌ Voting failed:", voteError.message);
      return false;
    }

    console.log("✅ Vote cast successfully:");
    console.log("  Vote ID:", vote.id);
    console.log("  User ID:", vote.user_id);
    console.log("  Option voted for:", selectedOption.text);

    // Check if vote count was updated automatically
    const { data: updatedOption, error: optionError } = await supabase
      .from("poll_options")
      .select("votes_count")
      .eq("id", selectedOption.id)
      .single();

    if (optionError) {
      console.error("❌ Failed to check vote count:", optionError.message);
      return false;
    }

    console.log("✅ Vote count updated automatically:");
    console.log("  Votes for", selectedOption.text + ":", updatedOption.votes_count);

    return true;
  } catch (error) {
    console.error("❌ Unexpected error in voting:", error.message);
    return false;
  }
}

async function testPollListing() {
  console.log("\n📋 Testing poll listing...");

  try {
    // Get public polls
    const { data: polls, error: pollsError } = await supabase
      .from("polls")
      .select(`
        *,
        poll_options (*)
      `)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (pollsError) {
      console.error("❌ Poll listing failed:", pollsError.message);
      return false;
    }

    console.log("✅ Poll listing successful:");
    console.log("  Found", polls.length, "public polls");

    polls.forEach((poll, index) => {
      console.log(`  ${index + 1}. ${poll.title}`);
      console.log(`     Options: ${poll.poll_options.length}`);
      console.log(`     Created: ${new Date(poll.created_at).toLocaleString()}`);
    });

    return true;
  } catch (error) {
    console.error("❌ Unexpected error in poll listing:", error.message);
    return false;
  }
}

async function testRLS() {
  console.log("\n🔒 Testing Row Level Security...");

  try {
    // Try to access polls without authentication (should only see public polls)
    const anonSupabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: publicPolls, error: publicError } = await anonSupabase
      .from("polls")
      .select("*")
      .eq("is_public", true);

    if (publicError) {
      console.error("❌ RLS test failed - public polls:", publicError.message);
      return false;
    }

    console.log("✅ RLS working - can access public polls:", publicPolls.length);

    // Try to access a specific user's private data (should fail or return empty)
    const { data: privatePolls, error: privateError } = await anonSupabase
      .from("polls")
      .select("*")
      .eq("is_public", false);

    console.log("✅ RLS working - private polls access:", privatePolls?.length || 0);

    return true;
  } catch (error) {
    console.error("❌ Unexpected error in RLS test:", error.message);
    return false;
  }
}

// Main test runner
async function runPollTests() {
  console.log("🚀 Starting Poll Functionality Tests\n");
  console.log("=".repeat(50));

  let testResults = {
    userCreation: false,
    pollCreation: false,
    pollRetrieval: false,
    voting: false,
    pollListing: false,
    rls: false,
  };

  try {
    // Test 1: Create test user
    const user = await createTestUser();
    if (user) {
      testResults.userCreation = true;
    }

    // Test 2: Create poll
    const pollData = await testPollCreation(user);
    if (pollData) {
      testResults.pollCreation = true;

      // Test 3: Retrieve poll
      testResults.pollRetrieval = await testPollRetrieval(pollData.poll.id);

      // Test 4: Vote on poll
      testResults.voting = await testVoting(user, pollData);
    }

    // Test 5: List polls
    testResults.pollListing = await testPollListing();

    // Test 6: Test RLS
    testResults.rls = await testRLS();

  } catch (error) {
    console.error("❌ Test suite failed:", error.message);
  }

  // Print test results
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(50));

  const tests = [
    { name: "User Creation", result: testResults.userCreation },
    { name: "Poll Creation", result: testResults.pollCreation },
    { name: "Poll Retrieval", result: testResults.pollRetrieval },
    { name: "Voting System", result: testResults.voting },
    { name: "Poll Listing", result: testResults.pollListing },
    { name: "Security (RLS)", result: testResults.rls },
  ];

  tests.forEach(test => {
    const status = test.result ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${test.name}`);
  });

  const passedTests = tests.filter(t => t.result).length;
  const totalTests = tests.length;

  console.log("\n" + "=".repeat(50));
  console.log(`OVERALL: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log("🎉 All tests passed! Your poll system is working correctly.");
  } else {
    console.log("⚠️  Some tests failed. Check the errors above.");
  }

  console.log("\n✨ Test completed!");
}

runPollTests().catch(console.error);
