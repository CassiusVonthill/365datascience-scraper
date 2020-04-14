module.exports = {
  sleep: function(ms) {
    return new Promise(r => setTimeout(r, ms))
  }
}
