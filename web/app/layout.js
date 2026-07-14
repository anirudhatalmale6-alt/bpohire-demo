import './globals.css';
import { DemoBar, Footer, Nav } from '../components/Chrome';

export const metadata = {
  title: 'BPOHire — Jobs & Recruitment for the BPO Industry',
  description:
    'The hiring platform built only for BPO and contact centers. Voice, non-voice, back office and support roles — post jobs, search, apply and message recruiters.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <DemoBar />
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
