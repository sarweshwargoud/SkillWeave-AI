import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database } from 'lucide-react';
import Navbar from '../components/Navbar';
import './TermsPage.css';

const PrivacyPage = () => {
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
            <Shield size={14} /> <span>Data Protection</span>
          </div>
          <h1>Privacy Policy</h1>
          <p className="legal-last-updated">Last Updated: November 2026</p>
        </div>

        <article className="legal-article">
          <section className="legal-section">
            <h2>1. Our Commitment to Privacy</h2>
            <p>
              At SkillWeave AI, your privacy and data ownership are core architectural priorities. We do not sell, rent, or trade your personal information with third parties or data brokers.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We collect only the minimum data required to deliver your learning experience:</p>
            <ul>
              <li><strong>Account Credentials:</strong> When you sign up via Email or Google OAuth, your authenticated email, display name, and avatar are managed through Supabase Auth.</li>
              <li><strong>Learning Workspace Data:</strong> Your saved course roadmaps, progress checkpoints, custom task states, notes, and chat histories are stored with strict Row-Level Security (RLS) tied to your Supabase User ID.</li>
              <li><strong>Cryptographic At-Rest Protection:</strong> Private study notes and sensitive learning artifacts are protected with AES-256-GCM encryption at rest.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Data</h2>
            <p>Your data is used exclusively to:</p>
            <ul>
              <li>Persist your progress across devices and sessions.</li>
              <li>Personalize tutor chat responses and handwritten note synthesis based on the videos you select.</li>
              <li>Verify cryptographic authentication tokens on protected API endpoints.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Third-Party Service Providers</h2>
            <p>We work with trusted infrastructure providers that adhere to rigorous security standards:</p>
            <ul>
              <li><strong>Supabase:</strong> For PostgreSQL data storage, Row-Level Security (RLS), and identity management.</li>
              <li><strong>Google Gemini AI:</strong> For transcript evaluation, syllabus sequencing, and educational tutoring. Prompts sent to Gemini are processed in accordance with Google Cloud enterprise privacy commitments.</li>
              <li><strong>YouTube Data API v3:</strong> For retrieving public video details and captions. No private YouTube account data is requested or stored.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Data Deletion & Export</h2>
            <p>
              You maintain full ownership of your data. You may delete any saved course, project, or note at any time directly through your Profile & Workspace interface. To request complete account deletion, contact{' '}
              <a href="mailto:privacy@skillweave.ai" className="legal-link">privacy@skillweave.ai</a>.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Security Measures</h2>
            <p>
              All traffic between your browser and SkillWeave AI is encrypted in transit using TLS 1.3. API endpoints enforce strict JSON Web Token (JWT) cryptographic signature verification and prevent Insecure Direct Object References (IDOR).
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default PrivacyPage;
