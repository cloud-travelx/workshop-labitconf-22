export const assert = (title: string, assertion: boolean): void => {
  console.log(`${title} ${assertion ? '✅' : '🛑'}  `);
  if (!assertion) {
    throw new Error(`Assertion fails on ${title}`);
  }
};