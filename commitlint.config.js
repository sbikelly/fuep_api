module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow any commit message for now
    'type-enum': [0],
    'subject-case': [0],
    'subject-empty': [0],
    'type-empty': [0],
  },
};
