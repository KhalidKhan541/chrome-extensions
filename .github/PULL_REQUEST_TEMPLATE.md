# Pull Request Template

## Description

<!-- Provide a clear and concise description of the changes -->

## Type of Change

<!-- Check all that apply -->

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test addition or update
- [ ] Build/CI configuration change
- [ ] Dependency update

## Related Issues

<!-- Link related issues using keywords: Fixes, Closes, Resolves, Related to -->
- Fixes #
- Related to #

## Changes Made

<!-- List the specific changes made in this PR -->

- 
- 
- 

## Testing

<!-- Describe how you tested your changes -->

### Test Plan

- [ ] Unit tests pass (`npm run test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Manual testing in Chrome:
  - [ ] Load unpacked extension
  - [ ] Test popup functionality
  - [ ] Test content script behavior
  - [ ] Test background script behavior
  - [ ] Test options page (if applicable)
  - [ ] Test on different sites (for content scripts)

### Test Coverage

<!-- If adding new functionality, describe test coverage -->

- [ ] Added unit tests for new functions
- [ ] Added integration tests (if applicable)
- [ ] Updated existing tests for changed behavior

## Screenshots / Recordings

<!-- Required for UI changes -->

| Before | After |
|--------|-------|
| ![before](url) | ![after](url) |

## Checklist

<!-- Verify all items before requesting review -->

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
- [ ] I have updated the CHANGELOG.md (if applicable)

## Additional Context

<!-- Add any other context, configuration, or data that might be helpful for reviewers -->

## Deployment Notes

<!-- Any special deployment considerations -->

- [ ] No special deployment steps required
- [ ] Requires Chrome Web Store update
- [ ] Requires manifest version bump
- [ ] Migration needed for existing users