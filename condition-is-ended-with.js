const isEndedWith = (lhs, rhs) => {
  return lhs.substr(-rhs.length) === rhs;
}

exports.isEndedWith = isEndedWith;
