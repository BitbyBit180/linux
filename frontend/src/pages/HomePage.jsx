import HeroSection from '../components/HeroSection.jsx';

/** Home route (/) — landing hero with the distro ring. */
export default function HomePage({ onNavigate }) {
  return <HeroSection onNavigate={onNavigate} />;
}
