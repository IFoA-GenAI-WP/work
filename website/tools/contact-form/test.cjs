const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(__dirname + '/Code.gs', 'utf8');

function fixture({ quota = 3, failSend = false } = {}) {
  const values = { CONTACT_FORM_ID: 'our-form' };
  const sent = [];
  let locks = 0;
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({
      getProperty: key => values[key] || null,
      setProperty: (key, value) => { values[key] = value; }
    }) },
    LockService: { getScriptLock: () => ({
      waitLock: () => { locks++; }, releaseLock: () => { locks--; }
    }) },
    MailApp: {
      getRemainingDailyQuota: () => quota,
      sendEmail: mail => { if (failSend) throw new Error('Delivery failed'); sent.push(mail); }
    }
  });
  vm.runInContext(source, context);
  return { values, sent, notify: context.notifyContactSubmission, locks: () => locks };
}

function submission(overrides = {}, formId = 'our-form') {
  const answers = { Name: 'Example Visitor', Email: 'visitor@example.com', Topic: 'CAS workshop', Message: 'Please send workshop details.', ...overrides };
  return {
    source: { getId: () => formId },
    response: {
      getId: () => 'response-1',
      getItemResponses: () => Object.entries(answers).map(([title, value]) => ({
        getItem: () => ({ getTitle: () => title }), getResponse: () => value
      }))
    }
  };
}

const valid = fixture();
valid.notify(submission({ Message: '<script>literal text</script>', To: 'attacker@example.com' }));
assert.equal(valid.sent.length, 1);
assert.equal(valid.sent[0].to, 'bettyzhu912@gmail.com,lei.fang@qmul.ac.uk,daniel.craig.ramsay@gmail.com');
assert.equal(valid.sent[0].replyTo, 'visitor@example.com');
assert.equal(valid.sent[0].subject, '[IFoA GenAI website] CAS workshop');
assert.equal(valid.sent[0].htmlBody, undefined);
assert.match(valid.sent[0].body, /<script>literal text<\/script>/);
valid.notify(submission());
assert.equal(valid.sent.length, 1, 'Duplicate response should not send twice');
assert.equal(valid.locks(), 0);

for (const overrides of [
  { Email: 'visitor@example.com\r\nBcc:someone@example.com' },
  { Name: '' }, { Name: 'a'.repeat(121) },
  { Message: '' }, { Message: 'a'.repeat(5001) },
  { Topic: 'Unlisted topic' }
]) {
  const invalid = fixture();
  assert.throws(() => invalid.notify(submission(overrides)), /Invalid contact response/);
  assert.equal(invalid.sent.length, 0);
  assert.equal(invalid.values.DELIVERED_RESPONSE_IDS, undefined);
  assert.equal(invalid.locks(), 0);
}

const wrongForm = fixture();
assert.throws(() => wrongForm.notify(submission({}, 'different-form')), /configured contact form/);
assert.equal(wrongForm.sent.length, 0);

for (const options of [{ quota: 2 }, { failSend: true }]) {
  const failure = fixture(options);
  assert.throws(() => failure.notify(submission()));
  assert.equal(failure.values.DELIVERED_RESPONSE_IDS, undefined, 'Failed delivery must remain retryable');
  assert.equal(failure.locks(), 0);
}
// Resume an interrupted setup whose Email item exists but is not yet required.
const formItems = [];
const triggers = [];
function makeItem(title = '') {
  const item = {
    title, required: false,
    getTitle() { return this.title; },
    setTitle(value) { this.title = value; return this; },
    setRequired(value) { this.required = value; return this; },
    setValidation(value) { this.validation = value; return this; },
    setChoiceValues(value) { this.choices = value; return this; },
    asTextItem() { return this; },
    asMultipleChoiceItem() { return this; },
    asParagraphTextItem() { return this; }
  };
  formItems.push(item);
  return item;
}
makeItem('Name');
makeItem('Email');
const form = {
  getId: () => 'our-form', getItems: () => formItems,
  addTextItem: () => makeItem(),
  addMultipleChoiceItem: () => makeItem(),
  addParagraphTextItem: () => makeItem(),
  supportsAdvancedResponderPermissions: () => true,
  getPublishedUrl: () => 'https://example.com/viewform',
  getEditUrl: () => 'https://example.com/edit'
};
for (const method of ['setTitle', 'setDescription', 'setConfirmationMessage', 'setCollectEmail',
  'setAllowResponseEdits', 'setLimitOneResponsePerUser', 'setPublishingSummary',
  'setShowLinkToRespondAgain', 'setPublished', 'setAcceptingResponses']) {
  form[method] = () => form;
}
function validator() {
  return {
    requireTextIsEmail() { this.kind = 'email'; return this; },
    requireTextLengthLessThanOrEqualTo(value) { this.max = value; return this; },
    build() { return this; }
  };
}
const setupContext = vm.createContext({
  console: { log() {} },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => 'our-form', setProperty() {} }) },
  FormApp: { openById: () => form, create: () => { throw new Error('Must reuse the existing form'); },
    createTextValidation: validator, createParagraphTextValidation: validator },
  ScriptApp: {
    getProjectTriggers: () => triggers,
    newTrigger: handler => ({ forForm: target => ({ onFormSubmit: () => ({ create: () => {
      triggers.push({ getHandlerFunction: () => handler, getTriggerSourceId: () => target.getId() });
    } }) }) })
  }
});
vm.runInContext(source, setupContext);
setupContext.setupContactForm();
setupContext.setupContactForm();
assert.equal(formItems.length, 4, 'Setup must not duplicate existing questions');
assert.equal(triggers.length, 1, 'Setup must not duplicate the submission trigger');
assert.ok(formItems.every(item => item.required), 'Partial setup must restore all required fields');
assert.equal(formItems.find(item => item.title === 'Email').validation.kind, 'email');
assert.equal(formItems.find(item => item.title === 'Message').validation.max, 5000);

console.log('Contact setup and notification checks passed (mocked services; no emails sent).');
