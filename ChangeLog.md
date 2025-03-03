Bug Fixes:

- Bug 1: Fixed dropdown scroll issue by changing the dropdown position from 'fixed' to 'absolute'.
- Bug 2: Added `htmlFor={inputId}` to correctly associate the label with the input.
- Bug 3: Fixed issue with "All Employees" dropdown option by adding a valid ID instead of an empty string.
- Bug 4: Fixed issue where clicking "View More" replaced initial transactions instead of appending new data.
- Bug 5: Fixed employee filter loading issue by ensuring employee loading state is independent of transaction fetching.
- Bug 6: Fixed "View More" button visibility issues by hiding it for filtered transactions and removing it when no more data is available.
- Bug 7: Persist transaction approval status when switching employee filters.

CodeSandbox - https://codesandbox.io/p/sandbox/c4rqnt
