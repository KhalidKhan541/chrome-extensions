const BreachChecker = (() => {
  const API_BASE = 'https://api.pwnedpasswords.com/range/';

  async function checkPassword(password) {
    try {
      const sha1 = await sha1Hash(password);
      const prefix = sha1.substring(0, 5);
      const suffix = sha1.substring(5);

      const response = await fetch(API_BASE + prefix);
      if (!response.ok) {
        return { error: true, message: 'Could not reach breach database.' };
      }

      const text = await response.text();
      const lines = text.split('\n');

      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix.trim().toUpperCase() === suffix.toUpperCase()) {
          const num = parseInt(count.trim(), 10);
          return {
            breached: num > 0,
            count: num,
            message: num > 0
              ? `Found in ${num.toLocaleString()} data breaches!`
              : 'Not found in any known breaches.'
          };
        }
      }

      return { breached: false, count: 0, message: 'Not found in any known breaches.' };
    } catch (err) {
      return { error: true, message: 'Network error. Check your connection.' };
    }
  }

  async function sha1Hash(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function formatCount(count) {
    if (count >= 1e9) return `${(count / 1e9).toFixed(1)} billion`;
    if (count >= 1e6) return `${(count / 1e6).toFixed(1)} million`;
    if (count >= 1e3) return `${(count / 1e3).toFixed(0)} thousand`;
    return count.toString();
  }

  return { checkPassword, formatCount };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BreachChecker;
}
