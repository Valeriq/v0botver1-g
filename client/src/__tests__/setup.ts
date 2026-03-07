/**
 * @fileoverview Test setup file for Vitest
 * Configures testing-library matchers and global test utilities
 */
import '@testing-library/jest-dom';

/**
 * Global test configuration
 * This file is imported by Vitest before running tests
 */

// Extend Vitest's expect with jest-dom matchers
// This provides matchers like:
// - toBeInTheDocument()
// - toHaveTextContent()
// - toBeVisible()
// - toBeDisabled()
// - etc.

// Note: If you need to add custom matchers or global test utilities,
// add them here before the test suite runs.
