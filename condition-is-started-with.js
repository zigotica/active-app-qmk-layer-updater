const isStartedWith = (lhs, rhs) => {
  return lhs.substr(rhs.length) === rhs;
}

exports.isStartedWith = isStartedWith;