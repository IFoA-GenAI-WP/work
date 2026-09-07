# Website contact form

This Google Apps Script creates the website's Google Form and sends every valid submission to Betty Zhu, Lei Fang and Daniel Ramsay. It needs permission to manage the form, install its submission trigger and send email. It does not request inbox access.

## Active form

- [Public contact form](https://docs.google.com/forms/d/e/1FAIpQLSeh_EBHZ5kmuBc3Y-BdxU-WfXTkFN5Ed0syrooi5H3BQBv_Ig/viewform)
- [Form editor and responses](https://docs.google.com/forms/d/1ZugO4zSNa8h6BCe1v2OvRYLFG7IMJiARSUmm6bUDBQk/edit) (owner access required)
- [Notification project](https://script.google.com/home/projects/15buWycOkDJn_68_Z4DcqCDU91MSeZs8Hkyer8v3qqZv77oA9-upvdg_w/edit) (owner access required)

Configured under `bettyzhu912@gmail.com` on 7 September 2026. The form accepts responses from anyone with the link. A clearly labelled test submission was saved and its notification trigger completed successfully; the test remains in Responses as a setup record. This verifies the Google mail send completed, not individual inbox receipt.

## Visitor experience

The form asks for **Name**, **Email**, **Topic** (Full Day or Half Day Gen AI Workshop, Presentations or General enquiry) and **Message**. All four fields are required. Visitors are told that their details will be shared with the three co-chairs to answer their enquiry. Response summaries are private, and the form does not require one response per Google account.

## Set up as bettyzhu912@gmail.com

1. Create a standalone project at [Google Apps Script](https://script.google.com/), then paste `Code.gs` into the editor.
2. In Project Settings, enable the manifest file, then replace `appsscript.json` with the version in this folder.
3. Run `setupContactForm` and approve the listed form, trigger and outgoing-mail permissions. Setup creates no test emails. It logs the public form URL and private editor URL. Rerunning it reuses the same form and trigger.
4. Open the public URL in a signed-out browser and submit a clearly labelled test enquiry. Confirm the notification trigger completes, all three recipients receive it, and Reply addresses the visitor. Keep test responses clearly labelled.
5. Set `contact_form_url` in `website/_config.yml` to the public URL ending in `/viewform`, with no query string. Deploy the website and verify the embedded form on a phone and desktop.

Until a tested form URL is configured, Contact Us offers an email link to the three co-chairs. The automatic form is not active merely because this script is checked in.

## Notification

- Recipients: `bettyzhu912@gmail.com`, `lei.fang@qmul.ac.uk`, `daniel.craig.ramsay@gmail.com`
- Subject: `[IFoA GenAI website] Full Day or Half Day Gen AI Workshop` (or the selected topic)
- Body: the visitor's name, email, topic and message, in plain text
- Reply-To: the visitor's validated email address

Submissions are saved in Google Forms. Outgoing mail uses the script owner's Google quota; inspect Apps Script executions and the form's Responses tab if a notification fails. Failed sends do not mark the response as delivered. The script suppresses repeated delivery for the 100 most recent successfully sent responses. There is no automatic reply to visitors.

The website build excludes this tools folder. The form and its responses belong to the Google account that runs setup; checking these files into GitHub does not publish responses or activate the script.

Run `node website/tools/contact-form/test.cjs` from the repository root to check notification recipients, Reply-To, validation, duplicate delivery and failed sends using mocked services. These checks send no emails; the live delivery test in setup is still required.
