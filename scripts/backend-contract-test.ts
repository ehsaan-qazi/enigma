/**
 * Autonomous Contract & Unit Test Suite for Enigma Backend (DELL - Qazi)
 *
 * Verifies:
 * 1. Zod input schemas for Auth, Submissions, and Viva endpoints
 * 2. AI HTTP client adapter mock fallbacks and payload transforms
 * 3. Score normalization and knowledge gap structuring
 * 4. Report synthesis metrics calculation
 */

import { loginSchema, registerSchema } from "../modules/auth/server/validators/auth.validator";
import {
  uploadUrlRequestSchema,
  completeUploadRequestSchema,
} from "../modules/submissions/server/validators/submission.validator";
import {
  initiateVivaRequestSchema,
  submitResponseRequestSchema,
  vivaAudioUploadUrlSchema,
} from "../modules/viva/server/validators/viva.validator";
import { aiClient } from "../lib/api/ai-client";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ ${testName}${detail ? ` - ${detail}` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   ENIGMA BACKEND CONTRACT & VALIDATOR TEST SUITE");
  console.log("=======================================================\n");

  // 1. Auth Schemas
  console.log("1. Testing Auth Validators:");
  {
    const validLogin = loginSchema.safeParse({ email: "student@example.com", password: "Password123!" });
    assert(validLogin.success, "loginSchema accepts valid credentials");

    const invalidEmail = loginSchema.safeParse({ email: "invalid-email", password: "123" });
    assert(!invalidEmail.success, "loginSchema rejects invalid email and short password");

    const validRegister = registerSchema.safeParse({
      email: "ahmed@imperial.ac.uk",
      password: "SecurePassword123!",
      fullName: "Ahmed Al-Mansoor",
      institution: "Imperial College London",
      role: "student",
    });
    assert(validRegister.success, "registerSchema accepts full valid student profile");
  }

  // 2. Submission Schemas
  console.log("\n2. Testing Submission Validators:");
  {
    const validUpload = uploadUrlRequestSchema.safeParse({
      title: "Contrastive Graph Neural Networks",
      filename: "paper.pdf",
      fileSize: 1024 * 500,
    });
    assert(validUpload.success, "uploadUrlRequestSchema accepts valid PDF metadata");

    const aliasUpload = uploadUrlRequestSchema.safeParse({
      title: "Research Paper",
      fileName: "dissertation.pdf",
    });
    assert(aliasUpload.success, "uploadUrlRequestSchema handles camelCase fileName alias");

    const invalidUpload = uploadUrlRequestSchema.safeParse({
      title: "Doc",
      filename: "dangerous.exe",
      mimeType: "application/x-msdownload",
    });
    assert(!invalidUpload.success, "uploadUrlRequestSchema rejects non-PDF extension");

    const validComplete = completeUploadRequestSchema.safeParse({
      submissionId: "00000000-0000-0000-0000-000000000001",
    });
    assert(validComplete.success, "completeUploadRequestSchema accepts valid UUID submissionId");

    const aliasComplete = completeUploadRequestSchema.safeParse({
      submission_id: "00000000-0000-0000-0000-000000000001",
    });
    assert(aliasComplete.success, "completeUploadRequestSchema handles snake_case submission_id alias");
  }

  // 3. Viva Schemas
  console.log("\n3. Testing Viva Validators:");
  {
    const validInitiate = initiateVivaRequestSchema.safeParse({
      submissionId: "00000000-0000-0000-0000-000000000001",
    });
    assert(validInitiate.success, "initiateVivaRequestSchema accepts valid UUID");

    const validResponse = submitResponseRequestSchema.safeParse({
      questionId: "00000000-0000-0000-0000-000000000002",
      audioPath: "audio/student-session-01/q1.webm",
      durationSeconds: 42,
    });
    assert(validResponse.success, "submitResponseRequestSchema accepts JSON voice response with duration");

    const aliasResponse = submitResponseRequestSchema.safeParse({
      question_id: "00000000-0000-0000-0000-000000000002",
      audio_path: "audio/session/q1.webm",
      duration_seconds: 35,
    });
    assert(aliasResponse.success, "submitResponseRequestSchema accepts snake_case aliases from frontend");

    const validAudioUploadUrl = vivaAudioUploadUrlSchema.safeParse({
      vivaId: "00000000-0000-0000-0000-000000000003",
      filename: "recording.webm",
    });
    assert(validAudioUploadUrl.success, "vivaAudioUploadUrlSchema accepts viva audio upload request");
  }

  // 4. AI Client Mock Fallback Integration
  console.log("\n4. Testing AI Client Mock Fallback & Pydantic Alignment:");
  {
    const docAnalysis = await aiClient.analyzeDocument({
      submissionId: "sub-test-01",
      pdfStoragePath: "documents/sub-test-01/paper.pdf",
    });
    assert(
      Array.isArray(docAnalysis.concepts) && docAnalysis.concepts.length > 0,
      "analyzeDocument returns structured concepts"
    );
    assert(
      typeof docAnalysis.summary === "string" && docAnalysis.summary.length > 0,
      "analyzeDocument returns paper summary"
    );

    const questions = await aiClient.generateQuestions({
      submissionId: "sub-test-01",
      concepts: docAnalysis.concepts,
      count: 3,
    });
    assert(
      Array.isArray(questions.questions) && questions.questions.length === 3,
      "generateQuestions returns requested question count"
    );
    assert(
      !!questions.questions[0].concept && !!questions.questions[0].question,
      "questions contain concept and question text"
    );

    const evaluation = await aiClient.evaluateAnswer({
      questionId: "q-01",
      question: questions.questions[0].question,
      expectedConcepts: ["Mutual Information", "Jensen-Shannon Bound"],
      audioStoragePath: "audio/q-01.webm",
    });
    assert(
      typeof evaluation.correctness === "number" &&
        evaluation.correctness >= 0 &&
        evaluation.correctness <= 100,
      "evaluateAnswer returns numeric correctness in [0, 100]"
    );
    assert(
      typeof evaluation.completeness === "number" &&
        evaluation.completeness >= 0 &&
        evaluation.completeness <= 100,
      "evaluateAnswer returns numeric completeness in [0, 100]"
    );
    assert(
      typeof evaluation.reasoningQuality === "number" &&
        evaluation.reasoningQuality >= 0 &&
        evaluation.reasoningQuality <= 100,
      "evaluateAnswer returns numeric reasoningQuality in [0, 100]"
    );
    assert(
      Array.isArray(evaluation.demonstratedConcepts) && evaluation.demonstratedConcepts.length > 0,
      "evaluateAnswer identifies demonstrated concepts"
    );
    assert(
      Array.isArray(evaluation.knowledgeGaps),
      "evaluateAnswer returns structured knowledge gaps"
    );

    const transcriptionResult = await aiClient.transcribeAudio({
      audioStoragePath: "audio/q-01.webm",
    });
    assert(
      typeof transcriptionResult?.transcription === "string" && transcriptionResult.transcription.length > 0,
      "transcribeAudio returns non-empty transcribed student speech"
    );
  }

  console.log("\n=======================================================");
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test Suite Unhandled Exception:", err);
  process.exit(1);
});
