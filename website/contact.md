---
layout: default
title: Contact Us
permalink: /contact/
nav_order: 6
---

# Contact Us

Have a question about the CAS workshop, our presentations, or the IFoA Generative AI Working Party? Get in touch with our co-chairs: Betty Zhu, Lei Fang and Daniel Ramsay.

{% if site.contact_form_url and site.contact_form_url != "" %}
<p><a href="{{ site.contact_form_url | escape }}" target="_blank" rel="noopener noreferrer">Open the contact form in a new tab</a></p>

<iframe class="contact-form" src="{{ site.contact_form_url | escape }}?embedded=true" title="Contact the IFoA Generative AI Working Party" loading="lazy">Loading contact form…</iframe>
{% else %}
<p><a href="mailto:bettyzhu912@gmail.com,lei.fang@qmul.ac.uk,daniel.craig.ramsay@gmail.com?subject=IFoA%20GenAI%20Working%20Party%20enquiry">Email the co-chairs</a></p>
{% endif %}
