---
layout: default
title: Contact Us
permalink: /contact/
nav_order: 6
---

<header class="page-intro">
  <p class="eyebrow">Get in touch</p>
  <h1>Contact Us</h1>
  <p>Connect with the IFoA Generative AI Working Party.</p>
</header>

<div class="contact-layout">
  <aside class="contact-aside" aria-label="Enquiry information">
    <section>
      <h2>Workshop enquiries</h2>
      <p>Interested in a Gen AI workshop? Ask about full-day or half-day formats, availability and arrangements for your team.</p>
    </section>
    <section>
      <h2>Presentations &amp; the working party</h2>
      <p>Send us a question about our talks, research or the working party.</p>
    </section>
    <section>
      <h2>Who receives your message</h2>
      <p>Your enquiry goes to our co-chairs: <strong>Betty Zhu, Lei Fang and Daniel Ramsay</strong>.</p>
    </section>
    {% if site.contact_form_url and site.contact_form_url != "" %}
    <p class="contact-fallback"><a href="{{ site.contact_form_url | escape }}" target="_blank" rel="noopener noreferrer">Open the form in a new tab</a></p>
    {% endif %}
  </aside>
  <div class="contact-panel">
    {% if site.contact_form_url and site.contact_form_url != "" %}
    <iframe class="contact-form" src="{{ site.contact_form_url | escape }}?embedded=true" title="Contact the IFoA Generative AI Working Party" loading="lazy">Loading contact form…</iframe>
    {% else %}
    <p><a href="mailto:bettyzhu912@gmail.com,lei.fang@qmul.ac.uk,daniel.craig.ramsay@gmail.com?subject=IFoA%20GenAI%20Working%20Party%20enquiry">Email the co-chairs</a></p>
    {% endif %}
  </div>
</div>
