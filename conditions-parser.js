const contained = require('./condition-is-contained.js');
const { isContained } = contained;
const ended = require('./condition-is-ended-with.js');
const { isEndedWith } = ended;
const equal = require('./condition-is-equal.js');
const { isEqual } = equal;
const started = require('./condition-is-started-with.js');
const { isStartedWith } = started;

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
