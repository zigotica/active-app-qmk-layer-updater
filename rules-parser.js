const { conditionsParser } = require('./conditions-parser.js');

const rulesParser = (data) => {
  const { CONDITIONS, RULES, DEFAULT, LITERALS } = data;

  let OUTPUT = DEFAULT;
  for(let i=0, l=RULES.length; i<l; i++) {
    const rule = RULES[i];
    const { operator, conditions, output } = rule;
    let qualifies = (operator === "and")? 1:0;

    conditions.forEach(condition => {
      const { id, expected } = condition;
      const fulfilled = conditionsParser(CONDITIONS[id], LITERALS);
      if(operator === 'and') qualifies *= fulfilled;
      if(operator === 'or') qualifies += fulfilled;
      if(!operator) qualifies = fulfilled === expected;
    });

    if(!!qualifies) {
      OUTPUT = output;
      break;
    }
  }

  return OUTPUT;
}

exports.rulesParser = rulesParser;
