const unusedVarsCfg = [
  'warn',
  { vars: 'all', args: 'none', ignoreRestSiblings: false, varsIgnorePattern: '_' }
];

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json']
  },
  env: {
    node: true,
    es6: true,
    es2020: true,
    mocha: true
  },
  plugins: ['sonarjs'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    // 'prettier',
    'plugin:sonarjs/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:sonarjs/recommended'
  ],
  ignorePatterns: ['algob.config.js', 'config/**/*.js', '.eslintrc.js'],
  rules: {
    'sonarjs/no-nested-template-literals': 'off',
    'ter-indent': 'off',
    'import/no-extraneous-dependencies': 0,
    'import/prefer-default-export': 'off',
    'max-classes-per-file': 0,
    'max-len': [
      'error',
      {
        code: 210,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true
      }
    ],
    'no-underscore-dangle': 0,
    'simple-import-sort/imports': 'off',
    'sort-imports': 'off',

    'no-unused-vars': unusedVarsCfg,
    '@typescript-eslint/no-unused-vars': unusedVarsCfg,

    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/no-dynamic-delete': 'off',
    '@typescript-eslint/quotes': 'off',
    semi: 'off', // required for a proper work
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/strict-boolean-expressions': 'off',
    'sonarjs/cognitive-complexity': ['error', 16],

    'no-trailing-spaces': 'off',
    'comma-dangle': 'off',

    '@typescript-eslint/no-non-null-assertion': 'off',
  }
};
