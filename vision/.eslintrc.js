module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ['plugin:vue/essential', '@vue/standard'],
  parserOptions: {
    parser: '@babel/eslint-parser'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    // 禁止函数圆括号之前有一个空格
    'space-before-function-paren': ['warn', 'never'],
    // 关闭驼峰命名规则
    'vue/multi-word-component-names': 0
  }
}
