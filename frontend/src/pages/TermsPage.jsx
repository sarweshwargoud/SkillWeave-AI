import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Scale, FileText, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import './TermsPage.css';

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page-container">
      <Navbar />

      <main className="legal-content-wrapper">
        <button className="legal-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> <span>Back</span>
        </button>

        <div className="legal-header">
          <div className="legal-badge">
            <Scale size={14} /> <span>Legal Terms</span>
          </div>
          <h1>Terms of Service</h1>
          <p className="legal-last-updated">Last Updated: November 2026</p>
        </div>

        <article className="legal-article">
          <section className="legal-section">
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing and using SkillWeave AI ("Platform", "we", "us"), you agree to be bound by these
              Terms of Service and our Privacy Policy. If you do not agree to all terms, you must discontinue
              use of our services immediately.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Educational Platform & AI Disclaimer</h2>
            <p>
              SkillWeave AI organizes public educational media from YouTube and utilizes generative AI models
              (Google Gemini) to synthesize syllabi, timestamped notes, and quiz questions. 
            </p>
            <ul>
              <li>AI-generated explanations, notes, and quizzes are provided for educational enhancement and supplemental study only.</li>
              <li>While we strive for accuracy, AI models may occasionally generate erroneous or incomplete explanations. Users are encouraged to verify critical technical materials against official documentation.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. YouTube & Third-Party Content</h2>
            <p>
              SkillWeave AI accesses YouTube video metadata and transcripts via documented YouTube API Services.
              By using SkillWeave AI, you acknowledge and agree to be bound by the{' '}
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="legal-link">
                YouTube Terms of Service
              </a>{' '}
              and the{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="legal-link">
                Google Privacy Policy
              </a>.
            </p>
            <p>
              All video copyrights, trademarks, and channel branding remain the exclusive intellectual property of their respective creators and publishers. SkillWeave AI does not claim ownership of third-party video content.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. User Accounts & Security</h2>
            <p>
              When you authenticate using Supabase Auth (Email or Google OAuth), you are responsible for maintaining the confidentiality of your session credentials. You agree to notify us immediately of any unauthorized access to your account.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Acceptable Use Policy</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Attempt to scrape, reverse engineer, or compromise the integrity of our API endpoints or backend databases.</li>
              <li>Circumvent authentication, access controls, or user-isolation security boundaries.</li>
              <li>Use the Platform to distribute abusive, defamatory, or unlawful content.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Limitation of Liability</h2>
            <p>
              In no event shall SkillWeave AI, its developers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages arising from your access to or inability to use the Platform.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Contact Information</h2>
            <p>
              If you have any questions or feedback regarding these Terms, please reach out to our engineering team at{' '}
              <a href="mailto:support@skillweave.ai" className="legal-link">support@skillweave.ai</a>.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default TermsPage;
