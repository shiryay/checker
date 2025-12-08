// check.js

const textInput = document.getElementById('textInput');

let rules = []; // each item: { regex: RegExp, tip: string }

// Load and parse rules.cfg
function loadCfg() {
  return fetch('rules.cfg')
    .then(response => response.text())
    .then(text => {
      rules = [];

      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          // Skip empty lines or comments starting with #
          continue;
        }

        // Split into [pattern, tip] by first comma
        const firstComma = trimmed.indexOf(',');
        if (firstComma === -1) {
          // No comma, skip this line
          continue;
        }

        const pattern = trimmed.slice(0, firstComma).trim();
        const tip = trimmed.slice(firstComma + 1).trim();
        if (!pattern) continue;

        try {
          // global + case-insensitive by default; adjust flags as needed
          const regex = new RegExp(pattern, 'gi');
          rules.push({ regex, tip });
        } catch (e) {
          console.error('Invalid regex in rules.cfg:', pattern, e);
        }
      }
    });
}

// Build the report text from current rules and input text
function buildReport(text) {
  if (!rules.length) {
    return 'No valid rules loaded from rules.cfg.';
  }

  const lines = [];

  for (const rule of rules) {
    // Get all matches
    rule.regex.lastIndex = 0;
    const matches = text.match(rule.regex) || []; // array or null [web:61][web:66]
    const count = matches.length;
    if (!count) {
       continue;
    }
    const occurrencesWord = count === 1 ? 'occurrence' : 'occurrences';

    // Unique matched strings (trimmed), preserving case as in text
    const uniqueMatches = Array.from(
      new Set(matches.map(m => m.trim()))
    ); // [web:64][web:67]

    const sampleText = uniqueMatches.length
      ? `"${uniqueMatches.join('", "')}"`
      : '(no matches in text)';

    lines.push(
      `${sampleText} - found ${count} ${occurrencesWord}, ${rule.tip}`
    );
  }

  return lines.join('\n');
}

// Called by the "Check" button
function checkText() {
  const originalText = textInput.value;

  loadCfg()
    .then(() => {
      const report = buildReport(originalText);
      textInput.value = report; // clear input and show results
    })
    .catch(err => {
      console.error('Error loading rules.cfg:', err);
      textInput.value = 'Error loading rules.cfg. See console for details.';
    });
}

// Called by the "Clear" button
function clearText() {
  textInput.value = '';
  textInput.focus();
}

// Updating rules from github
function updateRules() {
  const url = 'https://raw.githubusercontent.com/shiryay/FileValidator/refs/heads/master/FileValidator/rules.cfg';

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok: ' + response.status);
      }
      return response.text();
    })
    .then(text => {
      const blob = new Blob([text], { type: 'text/plain' });
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'rules.cfg'; // user will be prompted where to save
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch(err => {
      console.error('Error updating rules.cfg:', err);
      alert('Failed to update rules.cfg. See console for details.');
    });
}
