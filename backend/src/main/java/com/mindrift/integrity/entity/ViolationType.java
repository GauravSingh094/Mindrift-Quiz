package com.mindrift.integrity.entity;

/**
 * All detectable violation types.
 *
 * CLIENT-SIDE detections are sent by the browser SDK via POST /violations.
 * SERVER-SIDE detections are triggered by the server (e.g. duplicate submissions).
 */
public enum ViolationType {

    // ─── Browser / Client-Side ──────────────────────────────────────────────
    TAB_SWITCH,            // User switched to another tab / window
    WINDOW_BLUR,           // Focus left the quiz window
    FULLSCREEN_EXIT,       // Exited fullscreen mode during proctored quiz
    COPY_ATTEMPT,          // Ctrl+C or right-click copy detected
    PASTE_ATTEMPT,         // Ctrl+V or right-click paste detected
    CUT_ATTEMPT,           // Ctrl+X detected
    RIGHT_CLICK,           // Context-menu prevented

    // ─── DevTools ───────────────────────────────────────────────────────────
    DEVTOOLS_OPEN,         // Browser DevTools opened (size heuristic)
    CONSOLE_ACCESS,        // console object tampered with
    DEBUGGER_DETECTED,     // debugger; statement tripped

    // ─── Suspicious input patterns ───────────────────────────────────────────
    RAPID_ANSWER_CHANGE,   // Answer changed more than N times in a short window
    ANSWER_FLOOD,          // Answers submitted too fast (bot-like cadence)
    IMPOSSIBLE_TIMING,     // Answer received before question render time

    // ─── Network / Server-Side ──────────────────────────────────────────────
    IP_MISMATCH,           // IP address changed during attempt
    USER_AGENT_MISMATCH,   // Browser fingerprint changed mid-session
    MULTIPLE_SESSIONS,     // Same attempt accessed from two different clients
    DUPLICATE_SUBMISSION,  // Attempt submitted more than once concurrently

    // ─── Proctoring ──────────────────────────────────────────────────────────
    CAMERA_BLOCKED,        // Webcam feed blocked during proctored session
    FACE_NOT_DETECTED,     // No face visible in proctored frame
    MULTIPLE_FACES,        // More than one face detected
    AUDIO_ANOMALY;         // Abnormal audio detected in background
}
