import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginSide() {
  return (
    <div className="login-side">
      <div className="login-boks">
        <div className="login-logo">
          <img src="/images/logo/logo.webp" alt="KeasCare" className="login-logo-billede" />
        </div>
        <h1 className="login-titel">Log ind</h1>
        <p className="login-undertitel">KeasCare Markedssignaler</p>
        <LoginForm />
      </div>
    </div>
  );
}
