import React from 'react';

const Terms = () => {
  // Styles converted to a React style object
  const styles = {
    wrapper: {
      fontFamily: 'Arial, sans-serif',
      lineHeight: 1.6,
      padding: '40px',
      background: '#0d1117',
      color: '#e6edf3',
      minHeight: '100vh',
      boxSizing: 'border-box', // Ensures padding doesn't affect width calculation
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
      borderBottom: '1px solid rgba(255,255,255,0.1)', // Optional visual separator
      paddingBottom: '10px',
    },
    paragraph: {
      marginBottom: '15px',
    },
    link: {
      color: '#1db9ff',
      textDecoration: 'none',
    },
    ul: {
      paddingLeft: '20px',
    },
    li: {
      marginBottom: '10px',
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
        <h1 style={styles.h1}>Terms of Service</h1>
        <p style={styles.paragraph}>Last updated: November 5, 2025</p>

        <h2 style={styles.h2}>1. Acceptance of Terms</h2>
        <p style={styles.paragraph}>
          By accessing or using <strong>Omevo</strong>, you agree to be bound by these Terms of Service and our{' '}
          <a href="priv.html" style={styles.link}>Privacy Policy</a>. If you do not agree, please do not use the platform.
        </p>

        <h2 style={styles.h2}>2. Eligibility</h2>
        <p style={styles.paragraph}>
          You must be at least 18 years old (or the age of majority in your country) to use Omevo. 
          By using Omevo, you confirm that you meet this requirement.
        </p>

        <h2 style={styles.h2}>3. User Conduct</h2>
        <p style={styles.paragraph}>
          You agree not to use Omevo for illegal, harmful, or abusive purposes. This includes:
        </p>
        <ul style={styles.ul}>
          <li style={styles.li}>Harassment, bullying, or sharing explicit content</li>
          <li style={styles.li}>Spamming or impersonating other users</li>
          <li style={styles.li}>Using automated systems to scrape or interfere with the platform</li>
        </ul>

        <h2 style={styles.h2}>4. Account Suspension or Ban</h2>
        <p style={styles.paragraph}>
          We reserve the right to suspend or terminate your account for violations of our rules or community standards. 
          Users who are banned may be temporarily restricted for up to 750 hours or may request manual review through a paid appeal.
        </p>

        <h2 style={styles.h2}>5. Limitation of Liability</h2>
        <p style={styles.paragraph}>
          Omevo and its affiliates are not responsible for any damages, losses, or issues arising from your use of the platform. 
          You use Omevo at your own risk.
        </p>

        <h2 style={styles.h2}>6. Modifications to These Terms</h2>
        <p style={styles.paragraph}>
          We may update these Terms periodically. Continued use of the service after updates constitutes acceptance of the new terms.
        </p>

        <h2 style={styles.h2}>7. Contact Us</h2>
        <p style={styles.paragraph}>
          If you have questions or concerns about these Terms, you can contact us at:{' '}
          <a href="mailto:support@omevo.com" style={styles.link}>support@omevo.com</a>
        </p>

        <footer style={styles.footer}>
          &copy; 2025 Omevo. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Terms;
