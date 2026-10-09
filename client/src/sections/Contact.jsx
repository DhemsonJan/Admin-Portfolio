import { useState } from 'react';
import { contact, links } from '../site.js';
import Icon from '../components/Icon.jsx';
import Reveal from '../components/Reveal.jsx';
import MagneticButton from '../components/fx/MagneticButton.jsx';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';

const EMPTY = { name: '', email: '', message: '', company: '' };

/**
 * Contact form.
 *
 * Posts to the API, which validates, stores, and rate-limits. `company` is a
 * honeypot field: hidden from people, tempting to bots. It is not sent when
 * empty, and the server drops anything that fills it.
 */
function ContactForm() {
  const toast = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  const set = (patch) => {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (status === 'sending') return;

    setStatus('sending');
    setErrors({});

    try {
      const result = await api.sendContact({
        name: values.name,
        email: values.email,
        message: values.message,
        company: values.company,
      });
      setValues(EMPTY);
      setStatus('sent');
      toast.success('Message sent.', result.message);
    } catch (error) {
      setStatus('idle');
      if (error.fields && Object.keys(error.fields).length > 0) {
        setErrors(error.fields);
        toast.error('Check the form', error.message);
      } else {
        toast.fromError(error, 'Could not send your message. Please try again.');
      }
    }
  };

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="contact-row">
        <div className="field">
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={values.name}
            onChange={(e) => set({ name: e.target.value })}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            className={errors.name ? 'has-error' : ''}
            required
          />
          {errors.name && (
            <span className="field-error" id="contact-name-error">
              {errors.name}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={values.email}
            onChange={(e) => set({ email: e.target.value })}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            className={errors.email ? 'has-error' : ''}
            required
          />
          {errors.email && (
            <span className="field-error" id="contact-email-error">
              {errors.email}
            </span>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          placeholder="Tell me about the role or the project."
          value={values.message}
          onChange={(e) => set({ message: e.target.value })}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          className={errors.message ? 'has-error' : ''}
          required
        />
        {errors.message && (
          <span className="field-error" id="contact-message-error">
            {errors.message}
          </span>
        )}
      </div>

      {/* Honeypot — visually and programmatically hidden from people. */}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.company}
          onChange={(e) => set({ company: e.target.value })}
        />
      </div>

      <div className="contact-submit">
        <MagneticButton type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Sent' : 'Send Message'}
          <Icon name={status === 'sending' ? 'spark' : 'arrow'} size={17} />
        </MagneticButton>
        <p className="contact-hint" aria-live="polite">
          {status === 'sent'
            ? 'Thanks — I will reply soon.'
            : 'Or reach me on Gmail: '}
          {status !== 'sent' && (
            <a href={`mailto:${links.email}`}>{links.email}</a>
          )}
        </p>
      </div>
    </form>
  );
}

export default function Contact() {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <div className="contact-aura" aria-hidden="true" />
      <div className="wrap contact-inner">
        <Reveal className="contact-head">
          <p className="section-eyebrow is-center">
            <span className="section-eyebrow-mark" aria-hidden="true" />
            {contact.eyebrow}
          </p>
          <h2 className="contact-title" id="contact-title">
            {contact.title}
          </h2>
          <p className="contact-body">{contact.body}</p>

          <div className="contact-actions">
            {contact.actions.map((action) => (
              <MagneticButton
                key={action.value}
                as="a"
                href={action.href}
                className="btn btn-ghost btn-channel"
                {...(action.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
              >
                <span className="btn-channel-icon">
                  <Icon name={action.icon} size={17} />
                </span>
                <span className="btn-channel-text">
                  <span className="btn-channel-label">{action.label}</span>
                  <span className="btn-channel-value">{action.value}</span>
                </span>
              </MagneticButton>
            ))}
          </div>
        </Reveal>

        <Reveal delay={140} className="contact-form-wrap">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}