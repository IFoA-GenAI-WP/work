const CONTACT_RECIPIENTS = [
  'bettyzhu912@gmail.com',
  'lei.fang@qmul.ac.uk',
  'daniel.craig.ramsay@gmail.com'
];
const CONTACT_TOPICS = ['CAS workshop', 'Presentations', 'General enquiry'];
const CONTACT_TITLE = 'Contact the IFoA Generative AI Working Party';

// Run once as the form owner. Running again reuses the same form and trigger.
function setupContactForm() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const properties = PropertiesService.getScriptProperties();
    const existingId = properties.getProperty('CONTACT_FORM_ID');
    const form = existingId ? FormApp.openById(existingId) : FormApp.create(CONTACT_TITLE, false);
    properties.setProperty('CONTACT_FORM_ID', form.getId());
    form.setTitle(CONTACT_TITLE)
      .setDescription('Ask about the CAS workshop, our presentations, or the working party. Your name, email address and message will be shared with Betty Zhu, Lei Fang and Daniel Ramsay so we can respond to your enquiry.')
      .setConfirmationMessage('Thank you. Your message has been received.')
      .setCollectEmail(false)
      .setAllowResponseEdits(false)
      .setLimitOneResponsePerUser(false)
      .setPublishingSummary(false)
      .setShowLinkToRespondAgain(false);

    // Reapply settings so an interrupted setup can safely be resumed.
    const fields = {};
    form.getItems().forEach(item => { fields[item.getTitle()] = item; });
    (fields.Name ? fields.Name.asTextItem() : form.addTextItem())
      .setTitle('Name').setRequired(true)
      .setValidation(FormApp.createTextValidation().requireTextLengthLessThanOrEqualTo(120).build());
    (fields.Email ? fields.Email.asTextItem() : form.addTextItem())
      .setTitle('Email').setRequired(true)
      .setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
    (fields.Topic ? fields.Topic.asMultipleChoiceItem() : form.addMultipleChoiceItem())
      .setTitle('Topic').setChoiceValues(CONTACT_TOPICS).setRequired(true);
    (fields.Message ? fields.Message.asParagraphTextItem() : form.addParagraphTextItem())
      .setTitle('Message').setRequired(true)
      .setValidation(FormApp.createParagraphTextValidation().requireTextLengthLessThanOrEqualTo(5000).build());

    const hasTrigger = ScriptApp.getProjectTriggers().some(trigger =>
      trigger.getHandlerFunction() === 'notifyContactSubmission' &&
      trigger.getTriggerSourceId() === form.getId()
    );
    if (!hasTrigger) {
      ScriptApp.newTrigger('notifyContactSubmission').forForm(form).onFormSubmit().create();
    }
    if (form.supportsAdvancedResponderPermissions()) form.setPublished(true);
    form.setAcceptingResponses(true);
    console.log('Website URL: ' + form.getPublishedUrl());
    console.log('Private editor URL: ' + form.getEditUrl());
    return form.getPublishedUrl();
  } finally {
    lock.releaseLock();
  }
}

// Installed form-submit trigger: fixed recipients, plain text, visitor Reply-To.
function notifyContactSubmission(event) {
  const properties = PropertiesService.getScriptProperties();
  if (!event || !event.source || !event.response ||
      event.source.getId() !== properties.getProperty('CONTACT_FORM_ID')) {
    throw new Error('Expected a submission from the configured contact form.');
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const responseId = event.response.getId();
    const delivered = JSON.parse(properties.getProperty('DELIVERED_RESPONSE_IDS') || '[]');
    if (delivered.includes(responseId)) return;

    const answers = {};
    event.response.getItemResponses().forEach(item => {
      answers[item.getItem().getTitle()] = String(item.getResponse()).trim();
    });
    const name = answers.Name || '';
    const email = answers.Email || '';
    const topic = answers.Topic || '';
    const message = answers.Message || '';
    if (!name || name.length > 120 || !message || message.length > 5000 ||
        !/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email) ||
        !CONTACT_TOPICS.includes(topic)) {
      throw new Error('Invalid contact response. Review it in the form editor.');
    }
    if (MailApp.getRemainingDailyQuota() < CONTACT_RECIPIENTS.length) {
      throw new Error('Email quota exhausted. The enquiry remains saved in Google Forms.');
    }
    MailApp.sendEmail({
      to: CONTACT_RECIPIENTS.join(','),
      subject: '[IFoA GenAI website] ' + topic,
      replyTo: email,
      name: 'IFoA GenAI website',
      body: [
        'New website enquiry', '',
        'Name: ' + name,
        'Email: ' + email,
        'Topic: ' + topic, '',
        message, '',
        'Reply to this email to respond to the visitor.'
      ].join('\n')
    });
    properties.setProperty('DELIVERED_RESPONSE_IDS', JSON.stringify(delivered.concat(responseId).slice(-100)));
  } finally {
    lock.releaseLock();
  }
}
