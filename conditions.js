const isEqual = (lhs, rhs) => {
  return lhs === rhs;
}

const isContained = (lhs, rhs) => {
  return lhs.indexOf(rhs) > -1;
}

const isStartedWith = (lhs, rhs) => {
  return lhs.substr(rhs.length) === rhs;
}

const isEndedWith = (lhs, rhs) => {
  return lhs.substr(-rhs.length) === rhs;
}

exports.isEqual = isEqual;
exports.isContained = isContained;
exports.isStartedWith = isStartedWith;
exports.isEndedWith = isEndedWith;
