import React from 'react';

const Privacy = () => {
  const styles = {
    wrapper: {
      fontFamily: 'Arial, sans-serif',
      lineHeight: 1.6,
      padding: '40px',
      background: '#0d1117',
      color: '#e6edf3',
      minHeight: '100vh',
      boxSizing: 'border-box',
    },
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      background: 'rgba(255,255,255,0.05)',
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
    },
    h1: {
      color: '#1db9ff',
      fontSize: '2.5rem',
      marginTop: 0,
    },
    h2: {
      color: '#1db9ff',
      marginTop: '30px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      paddingBottom: '10px',
    },
    paragraph: {
      marginBottom: '15px',
    },
    ul: {
      paddingLeft: '20px',
    },
    li: {
      marginBottom: '10px',
    },
    link: {
      color: '#1db9ff',
      textDecoration: 'none',
    },
    footer: {
      marginTop: '40px',
      textAlign: 'center',
      fontSize: '0.9rem',
      color: '#999',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      paddingTop: '20px',
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.h1}>Privacy Policy</h1>
        <p style={styles.paragraph}>Last updated: November 5, 2025</p>

        <h2 style={styles.h2}>1. Introduction</h2>
        <p style={styles.paragraph}>
          Omevo respects your privacy and is committed to protecting your personal
          information. This Privacy Policy explains what information we collect,
          how we use it, and your rights regarding your data.
        </p>

        <h2 style={styles.h2}>2. Information We Collect</h2>
        <p style={styles.paragraph}>
          Depending on how you use Omevo, we may collect:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>IP address and approximate location.</li>
          <li style={styles.li}>Device and browser information.</li>
          <li style={styles.li}>Cookies and similar technologies.</li>
          <li style={styles.li}>Account information if you create an account.</li>
          <li style={styles.li}>
            Chat moderation data, reports, and ban history to help keep the
            platform safe.
          </li>
          <li style={styles.li}>
            Payment information for premium services. Payment details are
            processed securely by third-party payment providers (such as Stripe)
            and are not stored on Omevo's servers.
          </li>
        </ul>

        <h2 style={styles.h2}>3. How We Use Your Information</h2>
        <p style={styles.paragraph}>
          We use your information to:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Provide and improve Omevo.</li>
          <li style={styles.li}>Match users for video and text chats.</li>
          <li style={styles.li}>Prevent spam, fraud, abuse, and bots.</li>
          <li style={styles.li}>Enforce our Terms of Service.</li>
          <li style={styles.li}>Process payments and premium features.</li>
          <li style={styles.li}>Respond to support requests.</li>
        </ul>

        <h2 style={styles.h2}>4. Cookies</h2>
        <p style={styles.paragraph}>
          Omevo uses cookies and similar technologies to remember preferences,
          improve performance, prevent fraud, and analyze website usage. You can
          manage cookies through your browser settings, although some features
          may not function correctly if cookies are disabled.
        </p>

        <h2 style={styles.h2}>5. Third-Party Services</h2>
        <p style={styles.paragraph}>
          We may use trusted third-party providers to operate parts of our
          service, including payment processing, analytics, content delivery,
          and fraud prevention. These providers process information only as
          necessary to provide their services.
        </p>

        <h2 style={styles.h2}>6. Data Retention</h2>
        <p style={styles.paragraph}>
          We retain personal information only for as long as necessary to
          provide the service, comply with legal obligations, resolve disputes,
          and enforce our policies. Some moderation and security records may be
          retained longer to protect the platform.
        </p>

        <h2 style={styles.h2}>7. Your Rights</h2>
        <p style={styles.paragraph}>
          Depending on your location, you may have the right to:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Access your personal information.</li>
          <li style={styles.li}>Request correction of inaccurate information.</li>
          <li style={styles.li}>Request deletion of your personal data.</li>
          <li style={styles.li}>Object to or restrict certain processing.</li>
          <li style={styles.li}>Request a copy of your data where applicable.</li>
        </ul>

        <h2 style={styles.h2}>8. Children's Privacy</h2>
        <p style={styles.paragraph}>
          Omevo is intended only for users who are at least 18 years old (or the
          age of majority in their jurisdiction). We do not knowingly collect
          personal information from children.
        </p>

        <h2 style={styles.h2}>9. Security</h2>
        <p style={styles.paragraph}>
          We implement reasonable technical and organizational measures to help
          protect your information. However, no online service can guarantee
          complete security.
        </p>

        <h2 style={styles.h2}>10. Changes to This Privacy Policy</h2>
        <p style={styles.paragraph}>
          We may update this Privacy Policy from time to time. Any changes will
          be posted on this page with an updated "Last updated" date.
        </p>

        <h2 style={styles.h2}>11. Contact Us</h2>
        <p style={styles.paragraph}>
          If you have questions about this Privacy Policy or wish to exercise
          your privacy rights, contact us at{' '}
          <a href="mailto:support@omevo.com" style={styles.link}>
            support@omevo.com
          </a>.
        </p>

        <footer style={styles.footer}>
          &copy; 2025 Omevo. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Privacy;
