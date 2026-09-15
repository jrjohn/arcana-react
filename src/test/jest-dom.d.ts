// @testing-library/jest-dom@7's own `vitest.d.ts` augmentation targets Vitest's
// pre-v5 single-param `Assertion<T>` interface. Vitest 5 changed `Assertion` to
// `Assertion<R extends void | Promise<void> = void, T = unknown>`, so jest-dom's
// arity no longer lines up and its matcher types silently stop merging in
// (TS2339 on toBeInTheDocument/toHaveTextContent/etc). Re-declare it here with
// the correct v5 shape until jest-dom ships native vitest-5 support.
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  interface Assertion<R extends void | Promise<void> = void, T = unknown>
    extends TestingLibraryMatchers<T, R> {}
}
