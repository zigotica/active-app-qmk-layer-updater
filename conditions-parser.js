const { isContained } = require('./condition-is-contained.js');
const { isEndedWith } = require('./condition-is-ended-with.js');
const { isEqual } = require('./condition-is-equal.js');
const { isStartedWith } = require('./condition-is-started-with.js');

const conditionsParser = (condition, literals) => {
  const { type } = condition;
  let { lhs, rhs } = condition;
  let fulfilled = false;
  lhs = (typeof lhs === 'number')? lhs :literals[lhs];

  if(typeof rhs !== 'object') rhs = [rhs];
  for(let i=0, l=rhs.length; i<l; i++) {
    const desired = rhs[i];
    if(type === 'contains') {
      fulfilled = isContained(lhs, desired);
    } else if(type === 'ends') {
      fulfilled = isEndedWith(lhs, desired);
    } else if(type === 'starts') {
      fulfilled = isStartedWith(lhs, desired);
    } else if(type === 'equals') {
      fulfilled = isEqual(lhs, desired);
    }

    if(fulfilled === true) {
      break;
    }
  }

  return fulfilled;
}

exports.conditionsParser = conditionsParser;
